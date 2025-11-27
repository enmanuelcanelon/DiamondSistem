import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function LayoutCliente() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutCliente;
