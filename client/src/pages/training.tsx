const trainingSrc = `/api/it/training?v=${Date.now()}`;

export default function Training() {
  return (
    <div className="w-full">
      <iframe
        src={trainingSrc}
        title="Training"
        className="w-full border-0 h-[calc(100vh-8.5rem)] min-h-[500px]"
        data-testid="iframe-training"
      />
    </div>
  );
}
