import { supabase } from '../lib/supabase';

/**
 * Fetch all templates for a specific business unit
 * @param {number} unitId 
 * @returns {Promise<{data: any[], error: any}>}
 */
export const getTemplates = async (unitId, type = null) => {
    try {
        let query = supabase
            .from('communication_templates')
            .select('*')
            .eq('unit_id', unitId);

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching templates:', error);
        return { data: null, error };
    }
};

/**
 * Create a new template
 * @param {Object} templateData 
 * @returns {Promise<{data: any, error: any}>}
 */
export const createTemplate = async (templateData) => {
    try {
        const { data, error } = await supabase
            .from('communication_templates')
            .insert([templateData])
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error creating template:', error);
        return { data: null, error };
    }
};

/**
 * Update an existing template
 * @param {number} id 
 * @param {Object} templateData 
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateTemplate = async (id, templateData) => {
    try {
        const { data, error } = await supabase
            .from('communication_templates')
            .update(templateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error updating template:', error);
        return { data: null, error };
    }
};
