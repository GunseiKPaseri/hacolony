export default function IDText({ id }: { id: string }) {
  return (
    <div className="text-gray-400">
      @{id.slice(0, 6)}...{id.slice(-4)}
    </div>
  );
}
