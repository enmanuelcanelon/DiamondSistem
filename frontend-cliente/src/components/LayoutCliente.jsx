import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function LayoutCliente() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="pt-24 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutCliente;
