type SkeletonVariant = "home" | "favorites" | "journal" | "stores" | "catalog";

function Heading() {
  return (
    <div className="skeleton-heading">
      <span className="skeleton-block skeleton-eyebrow" />
      <span className="skeleton-block skeleton-title" />
      <span className="skeleton-block skeleton-description" />
    </div>
  );
}

function Cards() {
  return (
    <div className="drink-grid skeleton-cards">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <span className="skeleton-block skeleton-drink-image" />
          <span className="skeleton-block skeleton-card-brand" />
          <span className="skeleton-block skeleton-card-title" />
          <span className="skeleton-block skeleton-card-info" />
        </div>
      ))}
    </div>
  );
}

function Tabs() {
  return (
    <div className="skeleton-tabs">
      {Array.from({ length: 3 }, (_, index) => (
        <span className="skeleton-block" key={index} />
      ))}
    </div>
  );
}

export function PageSkeleton({
  variant = "home",
}: {
  variant?: SkeletonVariant;
}) {
  return (
    <main id="main" className="page-wrap page-skeleton">
      <p className="sr-only" role="status">
        화면을 불러오는 중이에요.
      </p>
      <div
        aria-hidden="true"
        className={`skeleton-content skeleton-${variant}`}
      >
        <Heading />
        {variant === "home" ? (
          <>
            <span className="skeleton-block skeleton-search" />
            <span className="skeleton-block skeleton-banner" />
            <span className="skeleton-block skeleton-section-title" />
            <Cards />
          </>
        ) : variant === "journal" ? (
          <>
            <Tabs />
            <div className="skeleton-calendar">
              <span className="skeleton-block skeleton-month" />
              <div className="skeleton-calendar-grid">
                {Array.from({ length: 42 }, (_, index) => (
                  <span className="skeleton-block" key={index} />
                ))}
              </div>
            </div>
            <span className="skeleton-block skeleton-record" />
          </>
        ) : variant === "stores" ? (
          <>
            <Tabs />
            <span className="skeleton-block skeleton-search" />
            <span className="skeleton-block skeleton-map" />
            <span className="skeleton-block skeleton-record" />
          </>
        ) : (
          <>
            <Tabs />
            <Cards />
          </>
        )}
      </div>
    </main>
  );
}
