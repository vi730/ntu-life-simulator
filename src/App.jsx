import React, { useState, useEffect, useCallback } from 'react';
import { Info, XCircle, CheckCircle } from 'lucide-react';
import './App.css';
import {
  IntroScreen,
  CharacterSelectScreen,
  GamePlayScreen,
  SideQuestPromptScreen,
  SideQuestScreen,
  ResultScreen
} from './components/GameScreens';

// --- Internal Component: Custom Notification Modal (Replaces window.alert) ---
const NotificationModal = ({ message, type = 'info', onConfirm }) => {
  const isNegative = type === 'error';
  const Icon = isNegative ? XCircle : (type === 'success' ? CheckCircle : Info);
  const color = isNegative ? '#ef4444' : (type === 'success' ? '#10b981' : '#667eea');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card-box anim-pop-in" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '32px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <Icon size={48} color={color} />
        </div>
        <p style={{ fontSize: '18px', color: '#374151', whiteSpace: 'pre-line', marginBottom: '32px', lineHeight: '1.6' }}>
          {message}
        </p>
        <button className="btn-primary" onClick={onConfirm} style={{ width: '100%', padding: '12px' }}>
          OK
        </button>
      </div>
    </div>
  );
};

export default function NTULifeSimulator() {
  // --- Game State ---
  const [gameState, setGameState] = useState('loading'); // loading, intro, character-select, playing, side-quest-prompt, side-quest, result
  const [gameData, setGameData] = useState(null);

  // --- Player State ---
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [initialStats, setInitialStats] = useState(null);
  const [scoreBoard, setScoreBoard] = useState({ academic: 0, love: 0, activity: 0, wealth: 0 });
  const [loveStatus, setLoveStatus] = useState(false);
  const [history, setHistory] = useState([]);

  // --- Progression State ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Achievement Flags ---
  const [loveExp, setLoveExp] = useState(0); // 0: None, 1: Triggered, 2: Active, 3: Rejected, 4: Cheating, 5: Loyal
  const [internExp, setInternExp] = useState(0); // 0: None, 1: Success, -1: Declined
  const [studyAbroadExp, setStudyAbroadExp] = useState(0); // 0: None, 1: Success, -1: Declined

  // --- Side Quest State ---
  const [sideQuestType, setSideQuestType] = useState(null);
  const [sideQuestIndex, setSideQuestIndex] = useState(0);
  const [triggerReason, setTriggerReason] = useState("");
  const [inLove, setInLove] = useState(0);
  const [sideQuestQuestions, setSideQuestQuestions] = useState([]);

  // --- Modal State ---
  const [modalConfig, setModalConfig] = useState(null);

  // 1. Data Loading (Converted to Async/Await)
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const dataPath = './data/';

        // Load Characters first to know IDs
        const charsRes = await fetch(`${dataPath}characters.json`);
        const charsData = await charsRes.json();
        const characters = charsData.characters;

        // Load all other assets in parallel
        const [
          gameText, gameConfig, endings,
          love1, love2, intern, abroad,
          ...characterQuestions
        ] = await Promise.all([
          fetch(`${dataPath}game_text.json`).then(res => res.json()),
          fetch(`${dataPath}game_config.json`).then(res => res.json()),
          fetch(`${dataPath}endings.json`).then(res => res.json()),
          fetch(`${dataPath}sidequests/love_1.json`).then(res => res.json()),
          fetch(`${dataPath}sidequests/love_2.json`).then(res => res.json()),
          fetch(`${dataPath}sidequests/intern.json`).then(res => res.json()),
          fetch(`${dataPath}sidequests/study_abroad.json`).then(res => res.json()),
          ...characters.map(char => fetch(`${dataPath}questions/character_${char.id}.json`).then(res => res.json()))
        ]);

        // Map questions to character IDs
        const mainQuestions = {};
        characters.forEach((char, index) => {
          mainQuestions[`character${char.id}`] = characterQuestions[index].questions;
        });

        setGameData({
          intro: gameText.intro,
          ui: gameText.ui,
          result: gameText.result,
          config: gameConfig.config,
          characters: characters,
          mainQuestions: mainQuestions,
          sideQuests: {
            loveA: love1.questions,
            loveB: love2.questions,
            intern: intern.questions,
            studyAbroad: abroad.questions
          },
          endings: endings.endings
        });

        setGameState('intro');
      } catch (error) {
        console.error('Failed to load game data:', error);
        // Fallback alert for critical failure is acceptable
        alert('Critical Error: Failed to load game data. Please refresh.');
      }
    };

    loadGameData();
  }, []);

  // 2. Game Logic Controllers

  // Helper: Reset all states for a new game
  const startGame = (character) => {
    setSelectedCharacter(character);
    setInitialStats({ ...character.stats, loveStatus: character.loveStatus });
    setScoreBoard({ ...character.stats });
    setLoveStatus(character.loveStatus);
    setCurrentQuestions(gameData.mainQuestions[`character${character.id}`] || []);
    setCurrentQuestionIndex(0);
    setHistory([]);
    setLoveExp(0);
    setInternExp(0);
    setStudyAbroadExp(0);
    setGameState('playing');
    setIsProcessing(false);
  };

  // Helper: Show custom modal
  const showModal = (message, type, callback) => {
    setModalConfig({ message, type, callback });
  };

  const closeModal = () => {
    const callback = modalConfig?.callback;
    setModalConfig(null);
    if (callback) callback();
  };

  // Logic: Handle main storyline choices
  const handleMainChoice = (option) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Calculate stats
    const calculateNewStats = (base, multiplier) => base * multiplier;
    const changes = {
      academic: calculateNewStats(initialStats.academic, option.stats.academic),
      love: calculateNewStats(initialStats.love, option.stats.love),
      activity: calculateNewStats(initialStats.activity, option.stats.activity),
      wealth: calculateNewStats(initialStats.wealth, option.stats.wealth)
    };

    const newScoreBoard = {
      academic: scoreBoard.academic + changes.academic,
      love: scoreBoard.love + changes.love,
      activity: scoreBoard.activity + changes.activity,
      wealth: scoreBoard.wealth + changes.wealth
    };

    setScoreBoard(newScoreBoard);
    setHistory(prev => [...prev, {
      question: currentQuestions[currentQuestionIndex].question,
      choice: option.text,
      result: option.result
    }]);

    // Delay to allow UI animation
    setTimeout(() => {
      checkForSideQuest(newScoreBoard);
    }, 400);
  };

  // Logic: Check if a side quest should trigger
  const checkForSideQuest = (currentStats) => {
    const { love, intern, studyAbroad } = gameData.config.sideQuests;
    let nextState = null;
    let nextConfig = {};

    // 1. Love Quest Trigger
    if (((currentStats.love > love.firstTrigger && loveExp === 0) ||
      (currentStats.love > love.secondTrigger && loveExp === 1)) &&
      loveExp < 2) {
      nextState = 'side-quest-prompt';
      nextConfig = {
        type: 'love',
        questions: loveExp === 0 ? gameData.sideQuests.loveA : gameData.sideQuests.loveB,
        reason: loveStatus
          ? "雖然你已經有交往對象，但你的魅力實在太高..."
          : "因為你的魅力值引起了某人的注意..."
      };
    }
    // 2. Internship Quest Trigger
    else if (currentStats.academic > intern.academicThreshold && internExp === 0) {
      nextState = 'side-quest-prompt';
      nextConfig = {
        type: 'intern',
        questions: gameData.sideQuests.intern,
        reason: "因為你的學業表現極為優異，系上教授推薦你一個難得的實習機會..."
      };
    }
    // 3. Study Abroad Quest Trigger
    else if ((currentStats.wealth + currentStats.activity) > studyAbroad.combinedThreshold && studyAbroadExp === 0) {
      nextState = 'side-quest-prompt';
      nextConfig = {
        type: 'studyAbroad',
        questions: gameData.sideQuests.studyAbroad,
        reason: "因為你的活躍表現與累積的財富，讓你獲得了出國交換的資格..."
      };
    }

    // Transition State
    if (nextState) {
      setSideQuestType(nextConfig.type);
      setSideQuestIndex(0);
      if (nextConfig.type === 'love') setInLove(0);
      setSideQuestQuestions(nextConfig.questions);
      setTriggerReason(nextConfig.reason);
      setGameState(nextState);
    } else {
      advanceMainGame();
    }
    setIsProcessing(false);
  };

  // Logic: Advance main game question or go to result
  const advanceMainGame = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('result');
    }
  };

  // Logic: Handle Side Quest Choices
  const handleSideQuestChoice = (option) => {
    const nextIndex = sideQuestIndex + 1;
    const isLoveQuest = sideQuestType === 'love';

    // Log History
    const questTitle = isLoveQuest
      ? gameData.ui.titles.sideQuest.love
      : (sideQuestType === 'intern' ? gameData.ui.titles.sideQuest.intern : gameData.ui.titles.sideQuest.studyAbroad);

    setHistory(prev => [...prev, {
      question: `【${questTitle}】${sideQuestQuestions[sideQuestIndex].question}`,
      choice: option.text,
      result: option.result
    }]);

    if (isLoveQuest) {
      const newInLove = inLove + option.inLoveChange;
      setInLove(newInLove);

      // Failure Condition (Heartbroken)
      if (newInLove <= 0) {
        setLoveExp(prev => prev + 1);
        showModal(gameData.ui.prompts.loveQuestFailed, 'error', () => finishSideQuest());
        return;
      }

      // Success Condition (Reached end)
      if (nextIndex >= sideQuestQuestions.length) {
        setLoveStatus(true);
        setLoveExp(prev => prev + 1);
        showModal(gameData.ui.prompts.loveQuestComplete, 'success', () => finishSideQuest());
        return;
      }
    } else {
      // Logic for Intern/Study Abroad (Stat based updates)
      const changes = {
        academic: initialStats.academic * option.stats.academic,
        love: initialStats.love * option.stats.love,
        activity: initialStats.activity * option.stats.activity,
        wealth: initialStats.wealth * option.stats.wealth
      };
      setScoreBoard(prev => ({
        academic: prev.academic + changes.academic,
        love: prev.love + changes.love,
        activity: prev.activity + changes.activity,
        wealth: prev.wealth + changes.wealth
      }));

      // Completion Condition
      if (nextIndex >= sideQuestQuestions.length) {
        if (sideQuestType === 'intern') {
          setInternExp(1);
          showModal(gameData.ui.prompts.internQuestComplete, 'success', () => finishSideQuest());
        } else {
          setStudyAbroadExp(1);
          showModal(gameData.ui.prompts.studyAbroadQuestComplete, 'success', () => finishSideQuest());
        }
        return;
      }
    }

    // Continue to next question if not finished
    setSideQuestIndex(nextIndex);
  };

  // Helper: Return to main game after side quest
  const finishSideQuest = () => {
    setGameState('playing');
    advanceMainGame();
  };

  // Logic: Accept/Decline Side Quest
  const handleQuestDecision = (accepted) => {
    if (accepted) {
      // Special logic: Cheating check
      if (sideQuestType === 'love' && loveStatus) {
        showModal("💔 你試圖隱瞞女友，但不幸被發現了！\n\n恢復單身狀態。", 'error', () => {
          setLoveStatus(false);
          setLoveExp(4); // Cheating flag
          finishSideQuest();
        });
      } else {
        setGameState('side-quest');
      }
    } else {
      // Decline Logic
      if (sideQuestType === 'love') setLoveExp(loveStatus ? 5 : 3); // 5: Loyal, 3: Rejected
      if (sideQuestType === 'intern') setInternExp(-1);
      if (sideQuestType === 'studyAbroad') setStudyAbroadExp(-1);
      finishSideQuest();
    }
  };

  // Logic: Calculate Ending
  const getEnding = () => {
    let goodResultCnt = 0;
    const PASS_RATIO = 0.5;
    const benchmarks = gameData.config.benchmarks;

    if (scoreBoard.academic > initialStats.academic && scoreBoard.academic >= benchmarks.academic * PASS_RATIO) goodResultCnt++;
    if (scoreBoard.love > initialStats.love && scoreBoard.love >= benchmarks.love * PASS_RATIO) goodResultCnt++;
    if (scoreBoard.activity > initialStats.activity && scoreBoard.activity >= benchmarks.activity * PASS_RATIO) goodResultCnt++;
    if (scoreBoard.wealth > initialStats.wealth && scoreBoard.wealth >= benchmarks.wealth * PASS_RATIO) goodResultCnt++;

    // Determine highest stats for ending flavor
    const attrNames = gameData.config.attributes;
    const fields = [
      { name: attrNames.academic.name, value: scoreBoard.academic },
      { name: attrNames.love.name, value: scoreBoard.love },
      { name: attrNames.activity.name, value: scoreBoard.activity },
      { name: attrNames.wealth.name, value: scoreBoard.wealth }
    ];
    fields.sort((a, b) => b.value - a.value);

    const [max, second, third, min] = fields.map(f => f.name);

    let endingData;
    if (goodResultCnt === 4) {
      const key = `${max}-${second}`;
      endingData = gameData.endings.goodGood[key] || gameData.endings.goodGood.default;
    } else if (goodResultCnt >= 2) {
      const key = `${max}-${min}`;
      endingData = gameData.endings.goodBad[key] || gameData.endings.goodBad.default;
    } else {
      const key = `${third}-${min}`;
      endingData = gameData.endings.badBad[key] || gameData.endings.badBad.default;
    }

    return { title: endingData.title, desc: endingData.description };
  };

  // 3. Render
  if (gameState === 'loading' || !gameData) {
    return <div className="game-container theme-main" style={{ color: 'white', fontWeight: 'bold', fontSize: '24px' }}>Loading...</div>;
  }

  return (
    <>
      {/* Game Screens based on State */}
      {gameState === 'intro' && (
        <IntroScreen
          intro={gameData.intro}
          buttonText={gameData.ui.buttons.startGame}
          onStart={() => setGameState('character-select')}
        />
      )}

      {gameState === 'character-select' && (
        <CharacterSelectScreen
          title={gameData.ui.titles.characterSelect}
          characters={gameData.characters}
          attributes={gameData.config.attributes}
          onSelect={startGame}
        />
      )}

      {gameState === 'side-quest-prompt' && (
        <SideQuestPromptScreen
          questType={sideQuestType}
          questNames={gameData.ui.titles.sideQuest}
          promptText={triggerReason}
          acceptText={gameData.ui.buttons.acceptQuest}
          declineText={gameData.ui.buttons.declineQuest}
          onAccept={() => handleQuestDecision(true)}
          onDecline={() => handleQuestDecision(false)}
        />
      )}

      {gameState === 'side-quest' && (
        <SideQuestScreen
          questType={sideQuestType}
          questNames={gameData.ui.titles.sideQuest}
          question={sideQuestQuestions[sideQuestIndex]}
          questionIndex={sideQuestIndex}
          totalQuestions={sideQuestQuestions.length}
          inLove={sideQuestType === 'love' ? inLove : null}
          loveValueLabel={gameData.ui.labels.loveValue}
          onChoice={handleSideQuestChoice}
        />
      )}

      {gameState === 'playing' && (
        <GamePlayScreen
          character={selectedCharacter}
          question={currentQuestions[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={currentQuestions.length}
          scoreBoard={scoreBoard}
          initialStats={initialStats}
          loveStatus={loveStatus}
          loveStatusLabel={gameData.ui.labels.loveStatus}
          progressLabel={gameData.ui.labels.questionProgress}
          attributes={gameData.config.attributes}
          onChoice={handleMainChoice}
          loveExp={loveExp}
          internExp={internExp}
          studyAbroadExp={studyAbroadExp}
          benchmarks={gameData.config.benchmarks}
          isProcessing={isProcessing}
        />
      )}

      {gameState === 'result' && (
        <ResultScreen
          character={selectedCharacter}
          ending={getEnding()}
          scoreBoard={scoreBoard}
          initialStats={initialStats}
          loveStatus={loveStatus}
          loveExp={loveExp}
          internExp={internExp}
          studyAbroadExp={studyAbroadExp}
          attributes={gameData.config.attributes}
          resultTexts={gameData.result}
          restartText={gameData.ui.buttons.restart}
          benchmarks={gameData.config.benchmarks}
          history={history}
          onRestart={() => {
            setGameState('intro');
            setSelectedCharacter(null);
            setScoreBoard({ academic: 0, love: 0, activity: 0, wealth: 0 });
            setCurrentQuestionIndex(0);
            setLoveExp(0);
            setInternExp(0);
            setStudyAbroadExp(0);
            setHistory([]);
          }}
        />
      )}

      {/* Global Notification Modal */}
      {modalConfig && (
        <NotificationModal
          message={modalConfig.message}
          type={modalConfig.type}
          onConfirm={closeModal}
        />
      )}
    </>
  );
}