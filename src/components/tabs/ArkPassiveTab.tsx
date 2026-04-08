import styles from './ArkPassiveTab.module.css';

type AnyData = Record<string, unknown>;

const NAME_STYLE: Record<string, string> = {
  '깨달음': styles.nameEnl,
  '진화':   styles.nameEvo,
  '도약':   styles.nameLeap,
};

export default function ArkPassiveTab({ data }: { data: unknown }) {
  if (!data) return <div className={styles.noData}>데이터가 없습니다.</div>;

  const d = data as AnyData;
  const columns = ['깨달음', '진화', '도약'];

  return (
    <div className={styles.grid}>
      {columns.map((colName) => {
        const pointInfo = ((d.Points as AnyData[]) || []).find((p) => p.Name === colName);
        const effects   = ((d.Effects as AnyData[]) || []).filter((e) => e.Name === colName);

        return (
          <div key={colName} className={styles.col}>
            <div className={styles.colHeader}>
              <div className={`${styles.colName} ${NAME_STYLE[colName]}`}>{colName}</div>
              <div className={styles.colPoints}>{(pointInfo?.Value as string) || 0}</div>
              <div className={styles.colDesc}>{(pointInfo?.Description as string) || '0랭크 0레벨'}</div>
            </div>
            <div className={styles.colBody}>
              {effects.length > 0 ? (
                effects.map((eff, idx) => (
                  <div key={idx} className={styles.effItem}>
                    {eff.Icon ? <img src={eff.Icon as string} alt={eff.Name as string} /> : null}
                    <div
                      className={styles.effDesc}
                      dangerouslySetInnerHTML={{ __html: eff.Description as string }}
                    />
                  </div>
                ))
              ) : (
                <div className={styles.empty}>활성화된 효과가 없습니다.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
