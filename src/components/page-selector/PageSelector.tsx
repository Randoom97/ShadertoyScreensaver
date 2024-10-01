import "./PageSelector.css";

export function PageSelector({
  results,
  resultsPerPage,
  currentPage,
  onPageChange,
}: {
  results: number;
  resultsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.ceil(results / resultsPerPage);

  const minPage = Math.max(1, currentPage - 2);
  const maxPage = Math.min(pageCount - 2, currentPage + 2);
  const buttonNumbers = [];
  for (let i = minPage; i <= maxPage; i++) {
    buttonNumbers.push(i);
  }

  function PageButton({ number }: { number: number }) {
    return (
      <button
        className={currentPage === number ? "selected" : ""}
        onClick={() => onPageChange(number)}
      >
        {number + 1}
      </button>
    );
  }

  const spacer = <span className="page-selector-text">...</span>;

  return (
    <div className="page-selector">
      <span className="page-selector-text">Results ({results}): </span>
      <PageButton number={0}></PageButton>
      {currentPage > 2 && spacer}
      {buttonNumbers.map((i) => (
        <PageButton key={i} number={i}></PageButton>
      ))}
      {currentPage < pageCount - 3 && spacer}
      <PageButton number={pageCount - 1}></PageButton>
    </div>
  );
}
