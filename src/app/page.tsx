import { Suspense } from "react";
import CharacterSearch from "@/components/CharacterSearch";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.badge}>Lost Ark Open API</div>
        <h1 className={styles.title}>
          망고네&nbsp;
          <span className={styles.titleBlue}>로스트아크</span>&nbsp;
          <span className={styles.titleGold}>정보 검색</span>
        </h1>
        <p className={styles.desc}>
          캐릭터의 클래스, 레벨, 장비 정보를 확인하세요
        </p>
      </div>
      <Suspense>
        <CharacterSearch />
      </Suspense>
    </main>
  );
}
