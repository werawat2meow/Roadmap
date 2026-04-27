import { supabaseAdmin } from "@/lib/supabaseServer";

export async function logApiAccess({
  clientId = null,
  tokenId = null,
  method,
  endpoint,
  requestIp = null,
  userAgent = null,
  statusCode,
  isSuccess = true,
  requestQuery = null,
  requestBody = null,
  responseBody = null,
  errorMessage = null,
}) {
  try {
    await supabaseAdmin.from("api_access_logs").insert({
      client_id: clientId,
      token_id: tokenId,
      method,
      endpoint,
      request_ip: requestIp,
      user_agent: userAgent,
      status_code: statusCode,
      is_success: isSuccess,
      request_query: requestQuery,
      request_body: requestBody,
      response_body: responseBody,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error("logApiAccess error:", error);
  }
}