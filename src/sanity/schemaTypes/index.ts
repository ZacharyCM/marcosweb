import { type SchemaTypeDefinition } from 'sanity'
import { productType } from './product'
import { siteUserType } from './siteUser'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [productType, siteUserType],
}
