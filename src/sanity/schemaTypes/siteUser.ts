import { defineType, defineField } from 'sanity'

export const siteUserType = defineType({
  name: 'siteUser',
  title: 'Site User',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Denied', value: 'denied' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    }),
  ],
})
