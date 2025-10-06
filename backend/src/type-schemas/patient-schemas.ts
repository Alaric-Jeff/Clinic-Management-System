import { Type, type Static } from "@fastify/type-provider-typebox";
import { Role, Gender } from "@prisma/client";

export const createPatientSchema = Type.Object({
    firstName: Type.String({ minLength: 2, maxLength: 30 }),
    lastName: Type.String({ minLength: 2, maxLength: 30 }),
    middleName: Type.Union([
        Type.String({ minLength: 1, maxLength: 30 }),
        Type.Null()
    ]),
    birthDate: Type.String({ 
        format: 'date-time', 
        description: 'Birth date in ISO 8601 format (e.g., 1990-05-15T00:00:00.000Z)'
    }), 
    gender: Type.Enum(Gender),
    csdIdOrPwdId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]), 
    mobileNumber: Type.Union([Type.String({ minLength: 1, pattern: '^\\+?[\\d\\s\\-()]+$' }), Type.Null()]),   
    residentialAddress: Type.Union([Type.String({ minLength: 1 }), Type.Null()])
});

export const createPatientServiceSchemaType = Type.Object({
    firstName: Type.String({ minLength: 2, maxLength: 30 }),
    lastName: Type.String({ minLength: 2, maxLength: 30 }),
    middleName: Type.Union([
        Type.String({ minLength: 1, maxLength: 30 }),
        Type.Null()
    ]),
    birthDate: Type.String({ format: 'date' }), 
    gender: Type.Enum(Gender),
    csdIdOrPwdId: Type.Union([Type.String(), Type.Null()]), 
    mobileNumber: Type.Union([Type.String(), Type.Null()]),   
    residentialAddress: Type.Union([Type.String(), Type.Null()]),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
    updatedByName: Type.Union([Type.String(), Type.Null()]),
    updatedByRole:  Type.Union([Type.Enum(Role), Type.Null()])
})

export type createPatientServiceType = Static<typeof createPatientServiceSchemaType>


export const createPatientSuccessResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
      id: Type.String(),
      firstName: Type.String(),
      lastName: Type.String(),
      middleName: Type.String(),
      createdAt: Type.String()
    })
})

export type createPatientType = Static<typeof createPatientSchema>;


export const getTodayPatientSchemaResponse = Type.Object({
    id: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    middleName: Type.String(),
    createdAt: Type.String()
});



// model Patient {
//   id                  String    @id @default(cuid())
//   firstName           String
//   lastName            String
//   middleName          String?   @default("N/A")
//   birthDate           DateTime
//   gender              Gender    // ✅ Added gender enum
//   csdIdOrPwdId        String?
//   mobileNumber        String?
//   residentialAddress  String?
//   isArchived          Boolean   @default(false)
  
//   // Denormalized audit fields only (no relations needed!)
//   createdByName       String    // "Dr. Jeffrey Aspiras" 
//   updatedByName       String    // "Nurse Maria Santos"
//   createdByRole       Role      // "admin"
//   updatedByRole       Role      // "encoder"
  
//   medicalDocumentations MedicalDocumentation[] //this could be null
  
//   createdAt           DateTime  @default(now())
//   updatedAt           DateTime  @updatedAt

//   @@map("patients")
//   @@index([isArchived])
//   @@index([createdAt])
//   @@index([lastName])
//   @@index([gender])    // ✅ Added index for gender-based queries
// }
