import { useEffect, useState } from "react";
import { Boxes, Ruler, Truck, UserRound } from "lucide-react";
import ItemService from "../../services/ItemService";
import UnitService from "../../services/UnitService";
import SupplierService from "../../services/SupplierService";
import UserService from "../../services/UserService";

function DashboardAdmin() {
  const [stats, setStats] = useState({
    items: 0,
    units: 0,
    suppliers: 0,
    users: 0,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const [items, units, suppliers, users] = await Promise.all([
        ItemService.getAll(),
        UnitService.getAll(),
        SupplierService.getAll(),
        UserService.getAll(),
      ]);

      if (active) {
        setStats({
          items: Array.isArray(items) ? items.length : 0,
          units: Array.isArray(units) ? units.length : 0,
          suppliers: Array.isArray(suppliers) ? suppliers.length : 0,
          users: Array.isArray(users) ? users.length : 0,
        });
      }
    }

    load().catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: "Barang", value: stats.items, icon: Boxes },
    { label: "Unit", value: stats.units, icon: Ruler },
    { label: "Supplier", value: stats.suppliers, icon: Truck },
    { label: "User", value: stats.users, icon: UserRound },
  ];

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Administrasi Master Data
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola barang, unit, supplier, dan user sistem.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {value}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DashboardAdmin;
