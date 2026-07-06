import {handleIntegrationGET,handleIntegrationPOST,} from "@/lib/integrationRouteHandler";

export async function GET(req) {
  return handleIntegrationGET(req, "positions");
}

export async function POST(req) {
  return handleIntegrationPOST(req, "positions");
}