import type { FastifyInstance } from "fastify";

export async function getMedicalDocumentation(
    fastify: FastifyInstance,
    body: {id: string}
){

    const {
        id
    } = body;

    try{
        const documentResult = await fastify.prisma.medicalDocumentation.findUnique({
            where:{
                id
            }, select: {
                id: true,
                patientId: true
            }
        })
        return documentResult
    }catch(err: unknown){

    }
}


// model MedicalDocumentation {
//   id           String   @id @default(cuid())
//   patientId    String
//   createdById  String
//   admittedById String? 
  
//   // Denormalized fields for UI display
//   createdByName    String
//   createdByRole    Role
//   admittedByName   String?
//   lastUpdatedByName String?
//   lastUpdatedByRole Role?
  
//   assessment   String?
//   diagnosis    String?
//   treatment    String?
//   prescription String?
  
//   status       DocumentationStatus @default(complete)
  
//   patient      Patient @relation(fields: [patientId], references: [id])
//   creator      Account @relation(fields: [createdById], references: [id])
//   admittedBy   Doctors? @relation(fields: [admittedById], references: [id])
  
//   medicalBill  MedicalBill?
//   auditLogs    DocumentAuditLog[]

//   createdAt    DateTime @default(now())
//   updatedAt    DateTime @updatedAt

//   @@map("medical_documentations")
//   @@index([patientId])
//   @@index([createdById])
//   @@index([admittedById]) 
//   @@index([status])
// }