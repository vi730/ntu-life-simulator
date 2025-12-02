import React, { useState } from 'react';
import { Heart, BookOpen, Zap, DollarSign, Sparkles, Briefcase, Plane, User, HeartCrack, Heart as HeartFilled } from 'lucide-react';
import '../App.css';

// ==========================================
// SECTION 1: Static Configuration & Core Logic
// ==========================================

// 1. Theme Color System
const THEME_COLORS = {
    love: '#ec4899',
    loveBg: '#fce7f3',
    intern: '#3b82f6',
    internBg: '#dbeafe',
    study: '#d97706',
    studyBg: '#fef3c7',
    success: '#10b981',
    successBg: '#dcfce7',
    danger: '#ef4444',
    dangerBg: '#fee2e2',
    gray: '#6b7280',
    grayBg: '#f3f4f6',
    grayLight: '#e5e7eb',
    textMain: '#1f2937',
    textSub: '#4b5563'
};

// 2. Icon Rendering Factory
const renderIconFactory = (iconName, color, size = 16) => {
    // Default props
    const props = { size, color };

    const iconMap = {
        // Basic Attributes
        BookOpen: <BookOpen {...props} />,
        Heart: <Heart {...props} />,
        Zap: <Zap {...props} />,
        DollarSign: <DollarSign {...props} />,
        // Status & Ending Specific
        HeartFilled: <HeartFilled size={size} fill={color} color={color} />,
        HeartCrack: <HeartCrack {...props} />,
        HeartNormal: <Heart {...props} />,
        BriefcaseSuccess: <Briefcase {...props} />,
        BriefcaseGray: <Briefcase {...props} />,
        PlaneSuccess: <Plane {...props} />,
        PlaneGray: <Plane {...props} />
    };
    return iconMap[iconName] || <Sparkles {...props} />;
};

// 3. Attribute Icon Getter (Wrapper)
const getAttributeIcon = (iconName, size = 16) => {
    return renderIconFactory(iconName, null, size);
};

// 4. Grade Calculation Logic (SS - D)
const getGradeInfo = (value, standard, gradeConfig) => {
    const ratio = value / standard;
    if (ratio >= 1.2) return { grade: 'SS', ...gradeConfig.SS };
    if (ratio >= 1.0) return { grade: 'S', ...gradeConfig.S };
    if (ratio >= 0.8) return { grade: 'A', ...gradeConfig.A };
    if (ratio >= 0.6) return { grade: 'B', ...gradeConfig.B };
    if (ratio >= 0.4) return { grade: 'C', ...gradeConfig.C };
    return { grade: 'D', ...gradeConfig.D };
};

// 5. Relationship Status Logic
// Note: Icon type is retained for data purposes, but UI will ignore it for the status pill.
const getFinalLoveStateData = (loveExp, loveStatus) => {
    if (loveExp === 4) return { text: '感情狀態：劈腿被抓', color: THEME_COLORS.danger, bg: THEME_COLORS.dangerBg, iconType: 'HeartCrack' };
    if (loveExp === 5) return { text: '感情狀態：修成正果', color: THEME_COLORS.success, bg: THEME_COLORS.successBg, iconType: 'HeartFilled' };
    if (loveStatus) return { text: '感情狀態：穩定交往中', color: THEME_COLORS.love, bg: THEME_COLORS.loveBg, iconType: 'HeartFilled' };
    return { text: '感情狀態：單身', color: THEME_COLORS.gray, bg: THEME_COLORS.grayBg, iconType: 'HeartCrack' };
};

// 6. Achievement Determination Logic
const getAchievementData = (type, exp, initialStats, loveStatus, texts) => {
    if (type === 'love') {
        const t = texts.love;
        // Priority: Special Endings
        if (exp === 4) return { text: t.cheating.status, sub: t.cheating.desc, color: THEME_COLORS.danger, iconType: 'HeartCrack' };
        if (exp === 5) return { text: t.loyal.status, sub: t.loyal.desc, color: THEME_COLORS.success, iconType: 'HeartFilled' };
        if (exp === 3) return { text: t.rejected.status, sub: t.rejected.desc, color: '#3b82f6', iconType: 'HeartCrack' };

        // Attempted love quest but failed/succeeded (Non-cheating/Non-loyal route)
        if (exp > 0) {
            if (!initialStats.loveStatus && loveStatus) return { text: t.success.status, sub: t.success.desc, color: THEME_COLORS.love, iconType: 'HeartFilled' };
            return { text: t.failed.status, sub: t.failed.desc, color: THEME_COLORS.danger, iconType: 'HeartCrack' };
        }

        // No events triggered
        const iconType = 'HeartNormal';
        const statusText = initialStats.loveStatus ? t.notTriggeredWithPartner : t.notTriggeredSingle;
        return { text: statusText.status, sub: statusText.desc, color: THEME_COLORS.gray, iconType };
    }

    if (type === 'intern') {
        const t = texts.intern;
        if (exp === 1) return { text: t.success.status, sub: t.success.desc, color: THEME_COLORS.success, iconType: 'BriefcaseSuccess' };
        if (exp === -1) return { text: t.declined.status, sub: t.declined.desc, color: THEME_COLORS.gray, iconType: 'BriefcaseGray' };
        return { text: t.notTriggered.status, sub: t.notTriggered.desc, color: THEME_COLORS.gray, iconType: 'BriefcaseGray' };
    }

    if (type === 'study') {
        const t = texts.studyAbroad;
        if (exp === 1) return { text: t.success.status, sub: t.success.desc, color: THEME_COLORS.success, iconType: 'PlaneSuccess' };
        if (exp === -1) return { text: t.declined.status, sub: t.declined.desc, color: THEME_COLORS.gray, iconType: 'PlaneGray' };
        return { text: t.notTriggered.status, sub: t.notTriggered.desc, color: THEME_COLORS.gray, iconType: 'PlaneGray' };
    }
    return {};
};


// ==========================================
// SECTION 2: React UI Components
// ==========================================

// 1. Intro Screen
export function IntroScreen({ intro, buttonText, onStart }) {
    return (
        <div className="game-container theme-intro">
            <div className="content-md anim-fade-in">
                <h1 style={{
                    fontSize: 'clamp(32px, 8vw, 64px)',
                    fontWeight: '900',
                    textAlign: 'center',
                    marginBottom: '32px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    台大生活模擬器
                </h1>
                <div className="glass-box" style={{ marginBottom: '40px', padding: '32px' }}>
                    <p style={{
                        fontSize: 'clamp(15px, 2.2vw, 18px)',
                        lineHeight: '1.8',
                        color: 'rgba(255, 255, 255, 0.95)',
                        whiteSpace: 'pre-line',
                        margin: 0,
                        textAlign: 'center'
                    }}>
                        {intro}
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button className="btn-primary" onClick={onStart}>{buttonText}</button>
                </div>
            </div>
        </div>
    );
}

// 2. Character Select Screen
export function CharacterSelectScreen({ title, characters, attributes, onSelect }) {
    return (
        <div className="game-container theme-main">
            <div className="content-lg">
                <h2 style={{
                    fontSize: 'clamp(28px, 6vw, 42px)',
                    fontWeight: '800',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '48px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {title}
                </h2>
                <div className="char-grid">
                    {characters.map((char, idx) => (
                        <CharacterCard
                            key={char.id}
                            character={char}
                            index={idx}
                            attributes={attributes}
                            onSelect={() => onSelect(char)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function CharacterCard({ character, index, attributes, onSelect }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div
            className="char-card anim-slide-up"
            onClick={onSelect}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="char-img-box">
                {!imageError ? (
                    <img
                        src={character.image}
                        alt={character.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', background: THEME_COLORS.grayLight
                    }}>
                        <User size={48} color="#9ca3af" />
                    </div>
                )}
            </div>

            <div style={{ padding: '0 8px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>
                    {character.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', fontStyle: 'italic', minHeight: '40px', lineHeight: '1.5' }}>
                    {character.description}
                </p>

                {/* MODIFIED: Relationship status is text only, no icon */}
                <div style={{
                    marginBottom: '20px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                    display: 'inline-block', // Changed from inline-flex to inline-block since no icon alignment needed
                    background: character.loveStatus ? THEME_COLORS.loveBg : THEME_COLORS.grayBg,
                    color: character.loveStatus ? THEME_COLORS.love : THEME_COLORS.gray
                }}>
                    {character.loveStatus ? '感情狀態：穩定交往中' : '感情狀態：單身'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.keys(attributes).map(key => (
                        <div key={key} className="stat-row">
                            <span style={{ color: attributes[key].color, display: 'flex', alignItems: 'center' }}>
                                {getAttributeIcon(attributes[key].icon)}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '45px', color: '#555' }}>
                                {attributes[key].name}
                            </span>
                            <div className="stat-track">
                                <div
                                    className="stat-fill"
                                    style={{ width: `${character.stats[key] * 10}%`, background: attributes[key].color }}
                                />
                            </div>
                            <span style={{
                                fontSize: '13px', fontWeight: '700', color: attributes[key].color,
                                minWidth: '24px', textAlign: 'right'
                            }}>
                                {character.stats[key]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 3. Game Play Screen
export function GamePlayScreen({
    character, question, questionIndex, totalQuestions, scoreBoard,
    initialStats, loveStatus, progressLabel, attributes, onChoice,
    loveExp, internExp, studyAbroadExp, benchmarks, isProcessing
}) {
    const progress = ((questionIndex + 1) / totalQuestions) * 100;

    const renderBadge = (type, exp) => {
        let config = null;
        if (type === 'love') {
            if (exp === 4) config = { bg: THEME_COLORS.dangerBg, color: THEME_COLORS.danger, text: '戀愛：劈腿被抓', icon: <HeartCrack size={12} /> };
            else if (exp === 5) config = { bg: THEME_COLORS.successBg, color: THEME_COLORS.success, text: '戀愛：忠貞不二', icon: <HeartFilled size={12} fill={THEME_COLORS.success} /> };
            else if (exp === 3) config = { bg: THEME_COLORS.grayBg, color: '#3b82f6', text: '戀愛：拒絕誘惑', icon: <Heart size={12} /> };
            else if (exp >= 1) {
                config = loveStatus
                    ? { bg: THEME_COLORS.loveBg, color: THEME_COLORS.love, text: '戀愛：脫單成功', icon: <HeartFilled size={12} fill={THEME_COLORS.love} /> }
                    : { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '戀愛：攻略失敗', icon: <HeartCrack size={12} /> };
            } else {
                config = { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '戀愛：未觸發', icon: <Sparkles size={12} /> };
            }
        } else if (type === 'intern') {
            if (exp === 1) config = { bg: '#dbeafe', color: '#3b82f6', text: '實習：獲得錄取', icon: <Briefcase size={12} /> };
            else if (exp === -1) config = { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '實習：已放棄', icon: <Briefcase size={12} /> };
            else config = { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '實習：未觸發', icon: <Briefcase size={12} /> };
        } else if (type === 'study') {
            if (exp === 1) config = { bg: '#fef3c7', color: '#d97706', text: '留學：取得資格', icon: <Plane size={12} /> };
            else if (exp === -1) config = { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '留學：已放棄', icon: <Plane size={12} /> };
            else config = { bg: THEME_COLORS.grayBg, color: THEME_COLORS.gray, text: '留學：未觸發', icon: <Plane size={12} /> };
        }

        if (!config) return null;
        return (
            <div style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '4px',
                background: config.bg, color: config.color,
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                {config.icon}
                {config.text}
            </div>
        );
    };

    return (
        <div className="game-container theme-main">
            <div className="content-md">
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>

                <div className="card-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px', fontWeight: '600' }}>
                                {progressLabel} {questionIndex + 1}/{totalQuestions}
                            </div>
                            <h3 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', color: THEME_COLORS.textMain }}>
                                {character.name}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <div style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                        background: loveStatus ? THEME_COLORS.loveBg : THEME_COLORS.grayLight,
                                        color: loveStatus ? THEME_COLORS.love : THEME_COLORS.gray,
                                        border: loveStatus ? `1px solid ${THEME_COLORS.loveBg}` : `1px solid ${THEME_COLORS.grayLight}`,
                                        display: 'inline-block'
                                    }}>
                                        {loveStatus ? '感情狀態：穩定交往中' : '感情狀態：單身'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {renderBadge('love', loveExp)}
                                    {renderBadge('intern', internExp)}
                                    {renderBadge('study', studyAbroadExp)}
                                </div>

                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '1 1 180px', minWidth: '180px' }}>
                            {Object.keys(attributes).map(key => {
                                const attr = attributes[key];
                                const current = scoreBoard[key];
                                const initial = initialStats[key];
                                const standard = benchmarks[key] || 100;

                                const displayPercentage = Math.round((current / standard) * 100);
                                const initialPct = Math.min((initial / standard) * 100, 100);
                                const currentPct = Math.min((current / standard) * 100, 100);
                                const isGrowing = current > initial;
                                const isDeclining = current < initial;

                                return (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#666' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: attr.color }}>
                                                {getAttributeIcon(attr.icon, 12)}
                                                <span>{attr.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <span>{displayPercentage}%</span>
                                                {isGrowing && <span style={{ color: THEME_COLORS.success, fontSize: '10px' }}>▲</span>}
                                                {isDeclining && <span style={{ color: THEME_COLORS.danger, fontSize: '10px' }}>▼</span>}
                                            </div>
                                        </div>
                                        <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: attr.color, width: `${initialPct}%`, opacity: 0.3, borderRadius: '999px' }} />
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: attr.color, width: `${currentPct}%`, opacity: 1, borderRadius: '999px', transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', fontWeight: '700', marginBottom: '32px', lineHeight: '1.4', color: '#1f2937' }}>
                        {question.question}
                    </h2>
                    <div className="options-grid">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                disabled={isProcessing}
                                onClick={() => onChoice(option)}
                                className="btn-option"
                                style={{ cursor: isProcessing ? 'wait' : 'pointer' }}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                {option.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 4. Side Quest Prompt Screen
export function SideQuestPromptScreen({ questType, questNames, promptText, acceptText, declineText, onAccept, onDecline }) {
    return (
        <div className="game-container theme-main">
            <div className="card-box anim-pop-in content-sm" style={{ textAlign: 'center', padding: '48px 32px' }}>
                <div style={{ fontSize: '60px', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <Sparkles size={64} color="#f59e0b" fill="#fef3c7" />
                </div>
                <div style={{
                    display: 'inline-block', padding: '6px 16px', background: '#fef3c7',
                    color: '#d97706', borderRadius: '20px', fontWeight: '700', marginBottom: '20px', fontSize: '14px'
                }}>
                    支線任務觸發
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME_COLORS.textMain, marginBottom: '16px' }}>
                    {questNames[questType]}
                </h2>
                <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>
                    {promptText}
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={onAccept} className="btn-primary" style={{ flex: '1 1 auto', maxWidth: '200px' }}>
                        {acceptText}
                    </button>
                    <button onClick={onDecline} style={{ background: '#f3f4f6', padding: '16px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', color: '#6b7280', border: 'none', cursor: 'pointer', flex: '1 1 auto', maxWidth: '160px', transition: 'background 0.2s' }}>
                        {declineText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 5. Side Quest Screen
export function SideQuestScreen({ questType, questNames, question, questionIndex, totalQuestions, inLove, loveValueLabel, onChoice }) {
    const themeInfo = {
        love: { class: 'theme-love', color: THEME_COLORS.love },
        intern: { class: 'theme-intern', color: THEME_COLORS.intern },
        studyAbroad: { class: 'theme-study', color: THEME_COLORS.study }
    }[questType];

    const getQuestIcon = (type) => {
        const props = { size: 18, style: { marginRight: '6px' } };
        switch (type) {
            case 'love': return <Heart {...props} fill={themeInfo.color} />;
            case 'intern': return <Briefcase {...props} />;
            case 'studyAbroad': return <Plane {...props} />;
            default: return <Sparkles {...props} />;
        }
    };

    return (
        <div className={`game-container ${themeInfo.class}`}>
            <div className="content-md anim-slide-up">
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                        background: 'white', padding: '8px 20px', borderRadius: '50px',
                        display: 'flex', alignItems: 'center', fontWeight: '700', color: themeInfo.color,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {getQuestIcon(questType)}
                        <span style={{ marginRight: '8px' }}>{questNames[questType]}</span>
                        <span style={{ background: themeInfo.color, color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>
                            特殊事件
                        </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '50px', fontWeight: '700', color: '#555', fontSize: '14px' }}>
                        進度 {questionIndex + 1} / {totalQuestions}
                    </div>
                </div>

                <div className="card-box" style={{ overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: themeInfo.color }} />

                    {questType === 'love' && inLove !== null && (
                        <div className="anim-pulse" style={{ textAlign: 'center', marginBottom: '24px', marginTop: '12px' }}>
                            <span style={{
                                color: inLove > 0 ? THEME_COLORS.love : THEME_COLORS.danger, fontWeight: '800',
                                background: '#fdf2f8', padding: '6px 20px', borderRadius: '20px',
                                display: 'inline-flex', alignItems: 'center', gap: '8px', border: `1px solid ${inLove > 0 ? '#fbcfe8' : '#fecaca'}`
                            }}>
                                {loveValueLabel}：{inLove}
                                {inLove > 0
                                    ? <HeartFilled size={16} fill={THEME_COLORS.love} color={THEME_COLORS.love} />
                                    : <HeartCrack size={16} fill={THEME_COLORS.danger} color={THEME_COLORS.danger} />
                                }
                            </span>
                        </div>
                    )}

                    <h3 style={{ fontSize: '26px', fontWeight: '800', textAlign: 'center', marginBottom: '32px', color: '#1f2937' }}>
                        {question.question}
                    </h3>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => onChoice(option)}
                                className="btn-white-outline"
                                style={{ color: themeInfo.color, borderColor: themeInfo.color }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = themeInfo.color; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = themeInfo.color; }}
                            >
                                <span style={{
                                    width: '28px', height: '28px', borderRadius: '50%', border: '1px solid currentColor',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', fontSize: '14px', fontWeight: '600'
                                }}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {option.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 6. Result Screen
export function ResultScreen({
    character, ending, scoreBoard, initialStats, loveStatus, loveExp,
    internExp, studyAbroadExp, attributes, resultTexts, restartText,
    onRestart, benchmarks, history
}) {
    const [imageError, setImageError] = useState(false);

    // Calculation Logic
    const finalLoveState = getFinalLoveStateData(loveExp, loveStatus);
    const achievementList = [
        { ...getAchievementData('love', loveExp, initialStats, loveStatus, resultTexts.achievementTexts), title: resultTexts.achievementTexts.love.title },
        { ...getAchievementData('intern', internExp, null, null, resultTexts.achievementTexts), title: resultTexts.achievementTexts.intern.title },
        { ...getAchievementData('study', studyAbroadExp, null, null, resultTexts.achievementTexts), title: resultTexts.achievementTexts.studyAbroad.title }
    ];

    return (
        <div className="game-container theme-result" style={{ display: 'block', overflowY: 'auto' }}>
            <div className="content-xl card-box" style={{ margin: '40px auto', padding: '48px' }}>

                {/* --- Header Section --- */}
                <div className="result-layout" style={{ marginBottom: '64px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

                        <div style={{
                            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', padding: '6px 20px',
                            borderRadius: '50px', color: 'white', fontWeight: '800', marginBottom: '20px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', fontSize: '14px', letterSpacing: '1px'
                        }} className="anim-pop-in">
                            {resultTexts.badges.legendary}
                        </div>

                        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#1f2937', marginBottom: '16px', lineHeight: '1.2' }}>
                            {ending.title}
                        </h1>
                        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', maxWidth: '400px', lineHeight: '1.6' }}>
                            {ending.desc}
                        </p>

                        <div className="char-img-box" style={{ height: '320px', width: '280px', background: '#f3f4f6', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                            {!imageError ? (
                                <img
                                    src={character.image}
                                    alt={character.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', background: THEME_COLORS.grayLight
                                }}>
                                    <User size={64} color="#9ca3af" />
                                </div>
                            )}
                        </div>

                        {/* MODIFIED: Relationship status is text only, no icon */}
                        <div style={{
                            marginTop: '24px',
                            padding: '10px 24px',
                            borderRadius: '50px',
                            fontSize: '15px',
                            fontWeight: '700',
                            background: finalLoveState.bg,
                            color: finalLoveState.color,
                            display: 'inline-block', // Removed icon alignment flex
                            gap: '8px'
                        }}>
                            {/* renderIconFactory call removed here */}
                            {finalLoveState.text}
                        </div>
                    </div>

                    {/* --- Stats Section --- */}
                    <div style={{ padding: '0 20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '28px', color: '#374151' }}>
                            {resultTexts.sectionTitles.socialClass}
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            {Object.keys(attributes).map((key, index) => {
                                const attr = attributes[key];
                                const final = scoreBoard[key];
                                const initial = initialStats[key];
                                const standard = benchmarks[key];

                                const gradeInfo = getGradeInfo(final, standard, resultTexts.grades);
                                const percentage = Math.min((final / standard) * 100, 100);
                                const initialPercentage = Math.min((initial / standard) * 100, 100);
                                const growthRate = ((final - initial) / standard) * 100;

                                return (
                                    <div key={key} style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s both` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-end' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ color: attr.color, background: `${attr.color}15`, padding: '6px', borderRadius: '8px' }}>
                                                    {getAttributeIcon(attr.icon, 20)}
                                                </span>
                                                <span style={{ fontWeight: '700', color: '#4b5563', fontSize: '15px' }}>{attr.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                                <span style={{ fontSize: '28px', fontWeight: '900', color: attr.color, lineHeight: '1' }}>
                                                    {percentage.toFixed(0)}
                                                    <span style={{ fontSize: '14px', marginLeft: '2px' }}>%</span>
                                                </span>
                                                <span style={{
                                                    marginLeft: '12px', background: gradeInfo.color, color: 'white',
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold'
                                                }}>
                                                    {gradeInfo.grade}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="result-stat-track">
                                            <div className="result-stat-fill" style={{ width: `${initialPercentage}%`, background: attr.color, opacity: 0.2 }} />
                                            <div className="result-stat-fill" style={{ width: `${percentage}%`, background: attr.color, animation: 'growWidth 1.5s ease-out forwards', '--target-width': `${percentage}%` }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
                                            <span>初始: {initial}</span>
                                            <span style={{ color: growthRate >= 0 ? THEME_COLORS.success : THEME_COLORS.danger, fontWeight: '600' }}>
                                                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}% 成長
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: THEME_COLORS.grayLight, margin: '48px 0' }} />

                {/* --- Achievements Grid --- */}
                <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '40px', textAlign: 'center', color: '#1f2937' }}>
                    {resultTexts.sectionTitles.achievements}
                </h2>

                <div className="achievements-grid" style={{ marginBottom: '48px' }}>
                    {achievementList.map((item, idx) => (
                        <div key={idx} className="anim-pop-in" style={{
                            background: 'white',
                            border: `2px solid ${item.color}30`,
                            borderRadius: '24px', padding: '36px 24px',
                            textAlign: 'center', animationDelay: `${1 + idx * 0.15}s`,
                            boxShadow: `0 10px 30px -10px ${item.color}20`
                        }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 4px 6px ${item.color}40)` }}>
                                {renderIconFactory(item.iconType, item.color, 48)}
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.title}
                            </div>
                            <div style={{ fontSize: '24px', color: item.color, fontWeight: '900', marginBottom: '12px' }}>
                                {item.text}
                            </div>
                            <div style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
                                {item.sub}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ height: '1px', background: THEME_COLORS.grayLight, margin: '48px 0' }} />

                {/* --- History Review --- */}
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', color: '#374151' }}>
                    {resultTexts.sectionTitles.lifeReview}
                </h2>
                <div style={{ background: '#f9fafb', borderRadius: '24px', padding: '32px', maxHeight: '500px', overflowY: 'auto', border: `1px solid ${THEME_COLORS.grayLight}` }}>
                    {history.map((log, index) => (
                        <div key={index} className="history-item anim-slide-up" style={{ animationDelay: `${index * 0.05}s`, marginBottom: index === history.length - 1 ? 0 : '24px' }}>
                            <div className="history-index" style={{ background: '#e5e7eb', color: '#6b7280' }}>{index + 1}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', color: '#374151', fontSize: '16px', marginBottom: '8px' }}>{log.question}</div>
                                <div className="history-content" style={{ background: 'white', border: '1px solid #e5e7eb' }}>
                                    <div style={{ fontSize: '13px', color: '#667eea', fontWeight: '700', marginBottom: '4px' }}>
                                        {resultTexts.labels.yourChoice}{log.choice}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#4b5563' }}>{log.result}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '56px', textAlign: 'center' }}>
                    <button onClick={onRestart} className="btn-primary" style={{ padding: '16px 48px', fontSize: '18px' }}>
                        <span style={{ marginRight: '10px' }}>↺</span>
                        {restartText}
                    </button>
                </div>
            </div>
        </div>
    );
}