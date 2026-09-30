export default function Logo({ tamanho = 40 }: { tamanho?: number }) {
  const t = tamanho * 1.6;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 14,
        padding: 6,
        height: t,
        flex: 'none',
      }}
    >
      <img
        src="/logo_de_morpara.png"
        alt="Prefeitura de Morpará"
        style={{ height: t - 12, width: 'auto', maxWidth: 'none', display: 'block' }}
      />
    </span>
  );
}