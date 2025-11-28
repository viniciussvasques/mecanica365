SELECT COUNT(*) as total_tenants FROM tenants;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_subscriptions FROM subscriptions;

SELECT 
    subdomain, 
    status, 
    "createdAt",
    document
FROM tenants 
ORDER BY "createdAt" DESC 
LIMIT 5;

SELECT 
    email,
    name,
    role,
    "tenantId",
    "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 5;

