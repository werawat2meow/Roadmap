import {handleIntegrationGET,handleIntegrationPOST,} from "@/lib/integrationRouteHandler";

export async function GET(req) {
  return handleIntegrationGET(req, "branches");
}

export async function POST(req) {
  return handleIntegrationPOST(req, "branches");
}