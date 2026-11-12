import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'한컵 · 취향을 발견하는 음료 도감',template:'%s · 한컵'},description:'여러 카페의 음료를 한곳에서 찾아보고, 영양정보로 비교하고, 나만의 한 잔을 기록하세요.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
