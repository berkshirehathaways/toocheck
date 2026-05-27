export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Toocheck · 투표 전 체크
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          프로젝트 세팅 완료
        </h1>
        <p className="text-muted-foreground">
          mock 데이터 기반 localhost MVP의 토대가 준비되었습니다. 이후 이슈에서
          도메인 타입·디자인 시스템·화면 페이지가 순차적으로 추가됩니다.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        본 서비스는 공개자료를 바탕으로 후보자 정보를 비교해 보여줍니다. 후보
        지지·반대 의도가 없습니다. 자료에 오류가 있다면 정정 요청을
        보내주세요.
      </div>
    </main>
  );
}
