// Variables d'environnement utilisées pendant les tests.
// La base "bazardim_test" est créée par Docker (database/docker-init) et vidée à chaque test :
// elle ne doit JAMAIS être la base de développement.
export const TEST_ENVIRONMENT = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://bazardim:bazardim@localhost:5432/bazardim_test',
  JWT_SECRET: 'secret-de-test-uniquement-pour-les-tests-automatiques',
  FRONT_URL: 'http://localhost:5173',
};
