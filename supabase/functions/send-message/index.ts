import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { messageId } = await req.json()

        // 1. Get message and campaign details
        const { data: message, error: mError } = await supabaseClient
            .from('messages')
            .select('*, campaign:campaigns(*, template:templates(*))')
            .eq('id', messageId)
            .single()

        if (mError || !message) throw new Error('Message not found')

        // 2. Get user's Evolution API credentials
        const { data: profile, error: pError } = await supabaseClient
            .from('profiles')
            .select('evolution_api_key, evolution_instance_id')
            .eq('id', message.campaign.user_id)
            .single()

        if (pError || !profile?.evolution_api_key) throw new Error('Evolution API credentials missing')

        // 3. Prepare message content (replace variables)
        // In a real scenario, you'd fetch the contact details here to replace {{nome}} etc.
        const { data: contact } = await supabaseClient
            .from('contacts')
            .select('*')
            .eq('id', message.contact_id)
            .single()

        let finalContent = message.campaign.template.content
        if (contact) {
            finalContent = finalContent.replace(/{{nome}}/g, contact.name)
            // Add other variable replacements as needed
        }

        // 4. Send to Evolution API
        const response = await fetch(`${Deno.env.get('EVOLUTION_API_URL')}/message/sendText/${profile.evolution_instance_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': profile.evolution_api_key
            },
            body: JSON.stringify({
                number: contact.phone,
                text: finalContent,
                options: {
                    delay: 1200,
                    presence: 'composing'
                }
            })
        })

        const result = await response.json()

        // 5. Update message status
        if (response.ok) {
            await supabaseClient
                .from('messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', messageId)

            // Update campaign count
            await supabaseClient.rpc('increment_campaign_sent', { camp_id: message.campaign_id })
        } else {
            await supabaseClient
                .from('messages')
                .update({ status: 'failed', error_message: result.message || 'Unknown error' })
                .eq('id', messageId)
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
