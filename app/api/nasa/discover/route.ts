import { fetchText } from "../../../../lib/nasa/fetchText.ts";
import { parseEvents, parseEarthImage, type Discovery } from "../../../../lib/nasa/discover.ts";
export const dynamic = "force-dynamic";

export async function GET() {
  const [events, image] = await Promise.allSettled([
    fetchText("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=100", "application/json", 900).then(({ body }) => parseEvents(JSON.parse(body))),
    fetchText("https://epic.gsfc.nasa.gov/api/natural", "application/json", 3600).then(({ body }) => parseEarthImage(JSON.parse(body))),
  ]);
  const result: Discovery = {
    events: events.status === "fulfilled" ? events.value.events : [],
    skipped: events.status === "fulfilled" ? events.value.skipped : 0,
    image: image.status === "fulfilled" ? image.value : null,
    eventsAvailable: events.status === "fulfilled",
    imageAvailable: image.status === "fulfilled" && image.value !== null,
    fetchedAt: new Date().toISOString(),
  };
  return Response.json(result, { status: !result.eventsAvailable && !result.imageAvailable ? 502 : 200 });
}
