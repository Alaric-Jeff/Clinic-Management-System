// model Service {
//   id              String          @id @default(cuid())
//   name            String          @unique
//   category        ServiceCategory
//   price           Float
//   isActivated     Boolean         @default(true)
//   isAvailable     Boolean         @default(true)
  
//   // Relations - Services can only be updated by admin
//   createdById     String
//   updatedById     String
//   creator         Account         @relation("ServiceCreator", fields: [createdById], references: [id])
//   updater         Account         @relation("ServiceUpdater", fields: [updatedById], references: [id])
  
//   createdAt       DateTime        @default(now())
//   updatedAt       DateTime        @updatedAt

//   @@map("services")
//   @@index([category])
//   @@index([isActivated])
//   @@index([name])
// }


import { Type, type Static } from "@sinclair/typebox";
import { ServiceCategory } from "@prisma/client";

export const createMedicalServiceSchema = Type.Object({
    name: Type.String({minLength: 3}),
    category: Type.Enum(ServiceCategory),
    price: Type.Number()
})

export type createMedicalServiceType = Static<typeof createMedicalServiceSchema>;


export const createMedicalServiceSuccessResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        name: Type.String(),
        category: Type.String(),
        price: Type.Number()
    })
})