import type { LanguageMode } from '../types';
import type { ShowError, ShowMode } from './types';
export const copy = (language: LanguageMode) => (ja: string, en: string, hira = ja) => language === 'ENGLISH' ? en : language === 'HIRAGANA' ? hira : ja;
export const MODE_COPY: Record<ShowMode, [string, string, string, string, string, string, string]> = {
  STANDARD: ['全員フリップ', 'All-play quiz', 'みんなでフリップ', '全員同時に回答。自由入力・手書きは司会がチェック、選択式は自動判定。', 'Everyone answers. The host checks text and handwriting; choices are graded automatically.', 'みんなでこたえよう。もじ・てがきはしかいがチェック。', 'panels'],
  BUZZER: ['早押しバトル', 'Buzzer battle', 'はやおしバトル', '最初に押した人が回答。不正解なら他の人へチャンス。', 'Buzz first to answer. A wrong answer opens the buzzer to everyone else.', 'いちばんにはやくおしてこたえよう。', 'bell'],
  SURVIVAL: ['ライフサバイバル', 'Three-life survival', 'ライフサバイバル', 'ライフは3つ。不正解で1つ減り、最後まで残ろう。', 'Start with three lives. Lose one for a wrong answer and try to stay in.', 'ライフは3つ。まちがえると1つへるよ。', 'heart'],
  TEAMS: ['チーム対抗', 'Team showdown', 'チームたいこう', '2〜8チームで対戦。メンバーの得点を合計して競う。', 'Compete in 2–8 teams. Each team’s score is the sum of its members’ scores.', '2〜8チームで、みんなのてんすうをあわせよう。', 'team'],
  CONSENSUS: ['全員一致チャレンジ', 'Perfect agreement', 'みんなでいっち', '全員の回答が一致したら全員に得点。手書きは司会が一致を判定。', 'Everyone scores if every answer matches. The host checks handwritten agreement.', 'みんなのおなじこたえをめざそう。', 'link'],
  MAJORITY: ['多数派はどっち？', 'Majority wins', 'おおいのはどっち？', '最も多い回答の人に得点。同数1位は両方正解、1人だけの回答は対象外。', 'The largest matching group scores. Tied groups both win; single answers do not.', 'いちばんおおいこたえでてんすうゲット。', 'crowd'],
  NEAREST: ['数値ニアピン', 'Closest number', 'すうじニアピン', '正解に近い順に100%・70%・50%・20%の得点。同じ距離は同順位。', 'Earn 100%, 70%, 50%, then 20% of the points by distance. Equal distances tie.', 'せいかいのすうじにちかいほど、こうとくてん。', 'target'],
  DRAW: ['お絵かきクイズ', 'Draw & guess', 'おえかきクイズ', '順番に1人がお題を描き、みんなで当てる。正解者が出ると描き手にも得点。', 'Take turns drawing a secret word. Guessers score; the artist gets a bonus when someone is right.', 'ひとりがえをかいて、みんなであてよう。', 'pen'],
  VOTE: ['大喜利・投票', 'Creative vote', 'おもしろとうひょう', '自由な回答を公開して1人1票。自分以外に投票し、1票につき10点。', 'Reveal your creative answers, then vote once for someone else. Each vote is worth 10 points.', 'たのしいこたえにとうひょう。じぶんにはいれられないよ。', 'vote'],
  WOLF: ['一致の人狼', 'Hidden-wolf consensus', 'いっちのじんろう', '全員一致10回、または狼を全員人間に戻せば人間側の勝ち。5問ごとに審議し、狼・能力者が秘密に行動。', 'Humans win with 10 agreements or no wolves left. Deliberate every five questions; wolves and special roles act in secret.', 'みんなのこたえを10かいそろえよう。ひそむおおかみをみつけよう。', 'wolf'],
};
export const ERRORS: Record<ShowError, [string, string, string]> = {
  FULL: ['部屋が満員です。回答者は最大40人、上映画面は最大4台です。', 'This room is full (40 answerers / 4 screens).', 'へやがいっぱいです。'],
  NAME: ['名前を入力してください。', 'Please enter your name.', 'なまえをいれてね。'],
  CLOSED: ['現在、参加受付を停止しています。', 'The host has closed admission.', 'いまはさんかできません。'],
  AUTH: ['この操作はできません。退出させられた場合は司会に確認してください。', 'This action is unavailable. If removed, please check with the host.', 'このそうさはできません。'],
  PHASE: ['今はこの操作ができません。進行状態と参加人数を確認してください。', 'Check the current phase and player count before using this control.', 'いまはこのそうさができません。'],
  QUESTION: ['問題を確認してください。選択式には選択肢と正解、ニアピンには数値の正解が必要です。', 'Check the question. Choices need a matching answer; closest-number needs a numeric answer.', 'もんだいとせいかいをかくにんしてね。'],
  ANSWER: ['回答を確認してください。提出後は変更できません。', 'Check your answer. Submitted answers are locked.', 'こたえをかくにんしてね。おくったあとはかえられないよ。'],
  LATE: ['回答を締め切りました。次の問題をお待ちください。', 'Answers are closed. Please wait for the next question.', 'こたえはしめきりました。つぎをまってね。'],
  BUZZ: ['他の人が先に押したか、今回は回答済みです。', 'Someone else buzzed first, or you have already answered.', 'ほかのひとがさきにおしたよ。'],
  VOTE: ['自分以外の提出済みの回答を選んでください。', 'Vote for a submitted answer other than your own.', 'じぶんいがいのこたえをえらんでね。'],
  NETWORK: ['接続できませんでした。通信と部屋コードを確認して再接続してください。', 'Connection failed. Check your network and room code, then reconnect.', 'つながりません。つうしんとへやコードをかくにんしてね。'],
  EXPIRED: ['部屋の有効期限が切れました。新しく作成してください。', 'The room expired. Please create a new room.', 'へやがしゅうりょうしました。'],
  RATE: ['少し待ってからもう一度操作してください。', 'Please wait a moment before trying again.', 'すこしまってからおしてね。'],
  NOT_FOUND: ['部屋が見つかりません。司会画面を開いたまま、コードを確認してください。', 'Room not found. Keep the host screen open and check the code.', 'へやがみつかりません。コードをかくにんしてね。'],
};
