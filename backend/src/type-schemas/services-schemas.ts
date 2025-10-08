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
import { Role } from "@prisma/client";


export const createMedicalServiceSchema = Type.Object({
    name: Type.String({minLength: 3}),
    category: Type.Enum(ServiceCategory),
    price: Type.Number()
})

export type createMedicalServiceType = Static<typeof createMedicalServiceSchema>;

export const createMedicalServiceFull = Type.Object({
    name: Type.String({minLength: 3}),
    category: Type.Enum(ServiceCategory),
    price: Type.Number(),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
})

export type createMedicalServiceFull = Static<typeof createMedicalServiceFull>;

export const createMedicalServiceSuccessResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        name: Type.String(),
        category: Type.String(),
        price: Type.Number()
    })
})

export const updateMedicalServiceSchema = Type.Object({
    id: Type.String(),
    name: Type.Union([Type.String({}), Type.Null()]),
    category: Type.Union([Type.String({}), Type.Null()]),
    price: Type.Union([Type.Number(), Type.Null()])
})

export type updateMedicalServiceType = Static<typeof updateMedicalServiceSchema>;

export const deleteServiceResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String()
})


export const medicalServiceId = Type.Object({
    id: Type.String()
})

export type medicalServiceType = Static<typeof medicalServiceId>;

export const getAllMedicalServicesResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
        category: Type.String(),
        price: Type.Number(),
        createdByName: Type.Union([Type.String(), Type.Null()]),
        createdAt: Type.String({format: 'date'})
    }))
})


/**
 *              id: true,
                name: true,
                category: true,
                price: true,
                createdByName: true,
                createdAt: true
 */
