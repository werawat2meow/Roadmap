import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL" },
        { status: 400 }
      );
    }

    const spacesEndpoint = process.env.DO_SPACES_ENDPOINT;
    const spacesBucket = process.env.DO_SPACES_BUCKET;

    if (!spacesEndpoint || !spacesBucket) {
      console.error( "DO_SPACES_ENDPOINT or DO_SPACES_BUCKET is not configured" );

      return NextResponse.json(
        { error: "DigitalOcean Spaces configuration is missing" },
        { status: 500 }
      );
    }

    const endpointUrl = new URL(spacesEndpoint);

    // เช่น sgp1.digitaloceanspaces.com
    const endpointHostname = endpointUrl.hostname;

    // เช่น hw1.sgp1.digitaloceanspaces.com
    const bucketHostname = `${spacesBucket}.${endpointHostname}`;

    /**
     * รองรับ 2 แบบ
     *
     * 1. Virtual-hosted style
     *    https://hw1.sgp1.digitaloceanspaces.com/Branches/xxx.webp
     *
     * 2. Path style
     *    https://sgp1.digitaloceanspaces.com/hw1/Branches/xxx.webp
     */

    const isVirtualHostedStyle = parsedUrl.hostname === bucketHostname;

    const isPathStyle =
      parsedUrl.hostname === endpointHostname &&
      (
        parsedUrl.pathname === `/${spacesBucket}` ||
        parsedUrl.pathname.startsWith(`/${spacesBucket}/`)
      );

    const isAllowed =
      parsedUrl.protocol === "https:" &&
      (isVirtualHostedStyle || isPathStyle);

    if (!isAllowed) {
      console.error("Image URL is not allowed:", {
        imageUrl,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
        endpointHostname,
        bucketHostname,
      });

      return NextResponse.json(
        { error: "Image URL is not allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "DigitalOcean image fetch failed:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        { error: "Unable to fetch image" },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") ||
      "application/octet-stream";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL is not an image" },
        { status: 400 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}