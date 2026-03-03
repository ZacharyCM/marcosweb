import { defineType, defineField, defineArrayMember } from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'strainType',
      title: 'Strain Type',
      type: 'string',
      options: {
        list: [
          { title: 'Sativa', value: 'sativa' },
          { title: 'Hybrid', value: 'hybrid' },
          { title: 'Indica', value: 'indica' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'thcPercent',
      title: 'THC %',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'cbdPercent',
      title: 'CBD %',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      description: 'Optional — number of units available',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'effects',
      title: 'Effects',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'e.g. Relaxing, Euphoric, Creative',
    }),
    defineField({
      name: 'media',
      title: 'Images & Videos',
      type: 'array',
      description: 'Upload images first — the first image appears as the product card thumbnail',
      of: [
        defineArrayMember({
          type: 'image',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt text' }),
          ],
        }),
        defineArrayMember({
          type: 'file',
          title: 'Video',
          options: { accept: 'video/*' },
          fields: [
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'strainType',
      media: 'media.0',
    },
  },
})
