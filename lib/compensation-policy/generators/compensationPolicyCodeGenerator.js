/**
 * ============================================================
 * Module : Compensation Policy
 * Layer : Generator
 * Version : 1.0.0
 * ============================================================
 */

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function generatePolicyCode() {

    const { data, error } =
        await supabaseAdmin.rpc(
            "generate_compensation_policy_code"
        );

    if(error){
        throw error;
    }

    return data;

}