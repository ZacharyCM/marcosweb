import "server-only"
import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"

export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Always fetch fresh data for auth operations — never stale CDN cache
  token: process.env.SANITY_WRITE_TOKEN, // Editor role token — server-only, NOT NEXT_PUBLIC_
})
