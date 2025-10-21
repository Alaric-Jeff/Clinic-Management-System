import { Type, type Static } from "@sinclair/typebox";

export const changedPasswordBodySchema = Type.Object({
    currentPassword: Type.String(),
    newPassword: Type.String({ 
        minLength: 8,
        pattern: '^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).+$',
        maxLength: 32
    })
});

export type changePasswordType = Static<typeof changedPasswordBodySchema>;