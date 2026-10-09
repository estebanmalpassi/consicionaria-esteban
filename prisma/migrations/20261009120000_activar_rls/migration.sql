-- Activa Row Level Security (RLS) en todas las tablas.
-- El sistema se conecta con el usuario dueño de las tablas, que no queda limitado por RLS
-- (no se usa FORCE), así que la app sigue funcionando igual. Cualquier otro usuario o
-- acceso directo a la base (por ejemplo, la Data API de Neon) no ve ninguna fila, porque
-- no hay políticas que lo permitan. Las tablas nuevas tienen que activarlo en su migración.

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dealership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DealershipDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Receipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SwipeAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehiclePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
