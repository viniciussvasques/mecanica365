SELECT id, name, subdomain, status, "createdAt" 
FROM tenants 
WHERE status = 'pending' 
ORDER BY "createdAt" DESC 
LIMIT 3;

SELECT u.email, u.name, u.role, t.subdomain, t.status, t."createdAt"
FROM users u 
JOIN tenants t ON u."tenantId" = t.id 
WHERE t.status = 'pending' 
ORDER BY t."createdAt" DESC 
LIMIT 3;

