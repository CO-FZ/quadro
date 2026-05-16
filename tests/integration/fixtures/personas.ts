// Credentials for test personas — deterministic, never use in production.
// Personas are created by globalSetup via seed.ts.
export const PERSONAS = {
  admin:    { email: 'test-admin@cofz.local',    password: 'TestAdmin123!',    role: 'admin'       as const },
  coord:    { email: 'test-coord@cofz.local',    password: 'TestCoord123!',    role: 'coordenador' as const },
  efetivo:  { email: 'test-efetivo@cofz.local',  password: 'TestEfetivo123!',  role: 'efetivo'     as const },
} as const

export type PersonaName = keyof typeof PERSONAS
