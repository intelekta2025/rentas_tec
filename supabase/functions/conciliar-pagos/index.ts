import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log(">>> INICIO DE FUNCION v3.0 - SI VES ESTO, EL CODIGO SE ACTUALIZO <<<");

Deno.serve(async (req) => {
    // Manejo de CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log(">>> PROCESANDO PETICION <<<");

        // 1. Conexión a Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { uploadId } = await req.json()
        if (!uploadId) throw new Error("uploadId es requerido")

        console.log(`>>> Upload ID recibido: ${uploadId}`);

        // 2. Obtener pagos pendientes (Staging)
        const { data: stagingItems, error } = await supabase
            .from('payment_staging')
            .select('*')
            .eq('upload_id', uploadId)
            .eq('status', 'Pending')

        if (error) throw error

        console.log(`>>> Items a procesar: ${stagingItems?.length || 0}`);

        let matches = 0
        let processed = 0

        // 3. Procesar cada pago
        for (const item of stagingItems) {
            const targetAmount = parseFloat(item.amount)

            // Obtener deudas pendientes (Solo necesitamos ID y Saldo)
            const { data: receivables } = await supabase
                .from('receivables')
                .select('id, balance_due')
                .eq('client_id', item.client_id)
                .in('status', ['Pending', 'Partial', 'Overdue', 'vencido', 'pendiente'])
                .order('due_date', { ascending: true }) // Importante: Más viejas primero

            // Ejecutar Algoritmo de Matching
            const match = findBestMatch(targetAmount, receivables || [])

            if (match) {
                // Si hay match, aplicar en BD
                await supabase.rpc('apply_payment_match', {
                    p_staging_id: item.id,
                    p_receivable_ids: match.ids,
                    p_amount: targetAmount
                })
                matches++
            } else {
                // Si no, marcar como sin coincidencia
                await supabase.from('payment_staging').update({ status: 'NO_MATCH' }).eq('id', item.id)
            }
            processed++
        }

        return new Response(
            JSON.stringify({ success: true, processed, matches }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(">>> ERROR EN FUNCION:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// --- ALGORITMO RECURSIVO OPTIMIZADO (Rule of 25 + Depth 6) ---
function findBestMatch(target: number, allInvoices: any[]) {
    const TOLERANCE = 0.50;
    const MAX_DEPTH = 6; // Buscamos combinaciones de hasta 6 facturas

    // OPTIMIZACIÓN CRÍTICA: Solo mirar las 25 más antiguas.
    // Esto previene que la CPU explote con clientes que deben años de renta.
    const invoicesToSearch = allInvoices.length > 25
        ? allInvoices.slice(0, 25)
        : allInvoices;

    const isClose = (curr: number, tgt: number) => Math.abs(curr - tgt) <= TOLERANCE;

    function search(startIndex: number, currentSelection: any[], currentSum: number): { ids: any[] } | null {
        // Si nos pasamos, abortar rama
        if (currentSum > target + TOLERANCE) return null;

        // Si coincide, ¡EUREKA!
        if (isClose(currentSum, target)) {
            return { ids: currentSelection.map(i => i.id) };
        }

        // Si llegamos al límite de profundidad, abortar rama
        if (currentSelection.length >= MAX_DEPTH) return null;

        // Probar siguiente factura
        for (let i = startIndex; i < invoicesToSearch.length; i++) {
            const invoice = invoicesToSearch[i];
            const amount = parseFloat(invoice.balance_due);

            const res = search(i + 1, [...currentSelection, invoice], currentSum + amount);
            if (res) return res; // Si encontramos match abajo, subirlo
        }
        return null;
    }

    return search(0, [], 0);
}