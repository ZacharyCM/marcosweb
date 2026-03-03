import { defineQuery } from 'groq'

// All products — full detail including resolved media URLs
export const ALL_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product"] | order(name asc) {
    _id,
    _type,
    name,
    strainType,
    price,
    thcPercent,
    cbdPercent,
    quantity,
    description,
    effects,
    "media": media[] {
      _type,
      _key,
      alt,
      caption,
      "url": asset->url,
      "mimeType": asset->mimeType
    }
  }
`)

// Single product by _id — full detail
export const PRODUCT_BY_ID_QUERY = defineQuery(`
  *[_type == "product" && _id == $id][0] {
    _id,
    _type,
    name,
    strainType,
    price,
    thcPercent,
    cbdPercent,
    quantity,
    description,
    effects,
    "media": media[] {
      _type,
      _key,
      alt,
      caption,
      "url": asset->url,
      "mimeType": asset->mimeType
    }
  }
`)

// Products by strain type — card-level fields only (used for Phase 4 carousels)
export const PRODUCTS_BY_STRAIN_QUERY = defineQuery(`
  *[_type == "product" && strainType == $strainType] | order(name asc) {
    _id,
    name,
    strainType,
    price,
    thcPercent,
    cbdPercent,
    "primaryImage": media[_type == "image"][0] {
      alt,
      "url": asset->url
    }
  }
`)

// All site users — for Phase 3 owner approval workflow in Studio
export const ALL_SITE_USERS_QUERY = defineQuery(`
  *[_type == "siteUser"] | order(_createdAt desc) {
    _id,
    email,
    name,
    status,
    _createdAt
  }
`)
