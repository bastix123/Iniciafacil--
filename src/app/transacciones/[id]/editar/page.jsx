import EditarTransaccion from "@/views/transacciones/EditarTransaccion";

export default async function Page({ params }) {
  const { id } = await params; 
  return <EditarTransaccion id={id} />;
}

