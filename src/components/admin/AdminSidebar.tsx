import { NavLink } from "react-router-dom";
const items = [{ to: "/admin", label: "Vue globale" }, { to: "/admin/catalog", label: "Catalogue" }];
export default function AdminSidebar() { return <aside className="glass metallic-border rounded-3xl p-4 space-y-2">{items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `block rounded-2xl px-4 py-3 transition ${isActive ? "bg-gold/10 text-gold border border-gold/20" : "hover:bg-white/5"}`}>{item.label}</NavLink>)}</aside>; }
