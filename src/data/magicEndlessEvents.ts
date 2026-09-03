/** Runtime data for the 90 female and 90 male generic magic endless events.
 * Source rows: docs/magic-endless-generic-events-90-plan.md and
 * docs/magic-endless-generic-male-events-90-plan.md.
 */

export interface MagicEndlessLearningDefinition {
  successEffects: string[];
  failureEffects: string[];
}

export interface MagicEndlessEventOptionDefinition {
  label: string;
  text: string;
  effects: string[];
  learning?: MagicEndlessLearningDefinition;
}

export interface MagicEndlessEventDefinition {
  id: string;
  availableFrom: number;
  center: string;
  title: string;
  description: string;
  options: MagicEndlessEventOptionDefinition[];
}

export const MAGIC_ENDLESS_EVENTS: MagicEndlessEventDefinition[] = [
  {
    "id": "MGE-001",
    "availableFrom": 1,
    "center": "あかり・しずく",
    "title": "魔法予定表の空欄",
    "description": "教室の黒板に貼られた一週間の予定表が、まだ決まっていない予定だけ星の粉で光っている。しずくは計画を立て、あかりは空欄に「楽しいこと」と書こうとしている。",
    "options": [
      {
        "label": "予定を組む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "空欄を残す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "みんなに書いてもらう",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-002",
    "availableFrom": 1,
    "center": "しずく・まどか",
    "title": "月光の朝練メモ",
    "description": "朝の校庭に、月の形をした付箋が一定の順番で並んでいる。しずくは暗号、まどかは昨日の時間装置の記録だと考えた。",
    "options": [
      {
        "label": "順番を計算する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "付箋を集める",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "朝練を続ける",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-003",
    "availableFrom": 1,
    "center": "ひより・こはる",
    "title": "花壇からの出席返事",
    "description": "花壇の花が、点呼のたびに小さく揺れて返事をする。ひよりは元気のない一輪を見つけ、こはるは風の通り道を変えようとしている。",
    "options": [
      {
        "label": "花を手入れする",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "風の流れを調べる",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "花壇の札を立て直す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-004",
    "availableFrom": 1,
    "center": "つばさ・ひより",
    "title": "炎で焼けた朝食",
    "description": "寮のトースターから、食パンではなく小さな炎の鳥が飛び出した。つばさは追いかけ、ひよりは驚かせないよう両手を広げる。",
    "options": [
      {
        "label": "炎の鳥を追う",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "餌を作る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "魔法を止める",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-005",
    "availableFrom": 1,
    "center": "れい・みらい",
    "title": "黒板のいたずら文字",
    "description": "黒板に書いた文字が、授業の合間に別の言葉へ書き換わっていく。「たすけて」「おなかすいた」「もう一回」と、誰かの気持ちだけが残されていた。",
    "options": [
      {
        "label": "影札で読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "みらいの劇にする",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "黒板を消す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-006",
    "availableFrom": 1,
    "center": "まどか・しずく",
    "title": "五分早いチャイム",
    "description": "時計が五分早く鳴り、授業と休み時間の境目がずれている。まどかは時計を直そうとし、しずくは全員の行動を記録して原因を探す。",
    "options": [
      {
        "label": "時刻を再計算する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "早い休み時間を楽しむ",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "時計の前で待つ",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-007",
    "availableFrom": 1,
    "center": "こはる・あかり",
    "title": "風で飛ぶプリント",
    "description": "廊下の窓から、授業プリントが一枚ずつ空へ逃げていく。こはるの風なら追いつけるが、あかりは飛んだ先に小さな光の道があることに気づいた。",
    "options": [
      {
        "label": "風を追い風にする",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "全員で拾う",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "一枚を見送る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-008",
    "availableFrom": 1,
    "center": "みらい・セラ",
    "title": "舞台袖の昼休み",
    "description": "昼休みの講堂で、誰もいない舞台にスポットライトが一つだけ灯る。みらいは幕の向こうに観客の気配を感じ、セラは光の色が星界の信号に似ていると言う。",
    "options": [
      {
        "label": "短い劇を始める",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "光の色を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "幕を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-009",
    "availableFrom": 1,
    "center": "セラ・れい",
    "title": "異世界語の宿題",
    "description": "セラのノートに、授業では習っていない星界文字が一行だけ現れた。れいはそれが古い封印の一部だと気づくが、セラはまず宿題として正しく書き写したい。",
    "options": [
      {
        "label": "文字を写す",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "封印として調べる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "先生に届ける",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      }
    ]
  },
  {
    "id": "MGE-010",
    "availableFrom": 1,
    "center": "あかり・ひより",
    "title": "制服に残る魔法汚れ",
    "description": "実技のあと、制服の袖に見たことのない虹色の汚れが残った。洗えば落ちそうだが、ひよりが触れると汚れの奥から小さな鼓動が返ってくる。",
    "options": [
      {
        "label": "丁寧に洗う",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "魔力を観察する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "記念に残す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-011",
    "availableFrom": 1,
    "center": "ひより・つばさ",
    "title": "透明な給食スープ",
    "description": "食堂のスープが透明になり、飲んだ人の今日の気分だけが湯気に浮かぶ。つばさは勢いよく飲もうとし、ひよりは不安な湯気をそっと包む。",
    "options": [
      {
        "label": "一口飲む",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "湯気を花に変える",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "食堂に返す",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-012",
    "availableFrom": 1,
    "center": "あかり・セラ",
    "title": "屋上の小さな星座",
    "description": "屋上の空に、教室の机より小さな星座が浮かんでいる。あかりは手を伸ばし、セラはその星の並びが「帰り道」を示していると読む。",
    "options": [
      {
        "label": "星をつなぐ",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "帰り道を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "星をそっと戻す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-013",
    "availableFrom": 1,
    "center": "れい・しずく",
    "title": "図書室の返却魔法",
    "description": "返却箱に入れた本が、翌朝には借りる前の棚へ戻っている。れいは本の影を追い、しずくは貸出記録の数字が一つだけ欠けていることを見つけた。",
    "options": [
      {
        "label": "記録を照合する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "本の影をたどる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "返却箱を封じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-014",
    "availableFrom": 1,
    "center": "こはる・まどか",
    "title": "寮の洗濯物結界",
    "description": "寮のベランダに干した洗濯物が、風もないのに円形に回っている。こはるは風を止め、まどかは洗濯物の動きが結界の図形になっていることに気づく。",
    "options": [
      {
        "label": "結界を完成させる",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "一枚ずつ取り込む",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "風に任せる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-015",
    "availableFrom": 1,
    "center": "みらい・セラ",
    "title": "消灯後の魔法ラジオ",
    "description": "消灯時間を過ぎた寮のラジオから、聞いたことのない番組が流れてくる。声は「今日できなかったこと」を一つずつ読み上げ、みらいはそれを夢の台本に書き留める。",
    "options": [
      {
        "label": "最後まで聴く",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "番組に返事をする",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "電源を切る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-016",
    "availableFrom": 1,
    "center": "つばさ・まどか",
    "title": "購買部の魔法雑貨",
    "description": "購買部の棚に、使い道の分からない魔法雑貨が三つ並んでいる。つばさは一番大きい道具を選び、まどかは値札の裏に書かれた使用条件を読んでいる。",
    "options": [
      {
        "label": "大きな道具を買う",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "値札を解析する",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "店員に相談する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-017",
    "availableFrom": 1,
    "center": "ひより・こはる",
    "title": "迷子の鍵チャーム",
    "description": "中庭で、鍵の形をした小さなチャームが泣き声のような音を立てている。ひよりが拾うと温かくなり、こはるが風を送ると校舎のどこかから返事があった。",
    "options": [
      {
        "label": "音の方向へ行く",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "チャームを休ませる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "掲示板に届ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-018",
    "availableFrom": 1,
    "center": "まどか・しずく",
    "title": "校門の逆さ時計",
    "description": "校門の時計だけが、針を逆向きに回している。まどかは昨日の事故を疑い、しずくは時計が示す時刻にだけ開く通路を発見する。",
    "options": [
      {
        "label": "時刻を待つ",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "時計を止める",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "通路を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-019",
    "availableFrom": 1,
    "center": "しずく・ひより",
    "title": "実技室の水たまり",
    "description": "実技室の床にできた水たまりが、触れた人の考えている問題を映している。しずくは答えを探し、ひよりは水面に映る不安を先に落ち着かせようとする。",
    "options": [
      {
        "label": "水面を読む",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "花を浮かべる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "水を拭き取る",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-020",
    "availableFrom": 1,
    "center": "あかり・つばさ",
    "title": "花火のような消しゴム",
    "description": "教室の消しゴムを使うたび、消した文字が小さな花火になって天井へ上がる。つばさはもっと消そうとし、あかりは消したくない言葉まで消えないよう止める。",
    "options": [
      {
        "label": "一問だけ消してみる",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "花火を外へ逃がす",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "消しゴムをしまう",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-021",
    "availableFrom": 1,
    "center": "れい・セラ",
    "title": "禁書しおりの返事",
    "description": "深淵図書館のしおりに、誰かが鉛筆で「まだ読まないで」と書き足している。れいは警戒し、セラは文字の端にある星界の記号を見つめる。",
    "options": [
      {
        "label": "記号を解読する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "しおりを封じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "司書へ渡す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      }
    ]
  },
  {
    "id": "MGE-022",
    "availableFrom": 1,
    "center": "セラ・あかり",
    "title": "魔法陣の落とし物",
    "description": "廊下の床に、誰かが落とした手のひらサイズの魔法陣がある。あかりが近づくと星が灯り、セラが触れると星界ではなく学園の地下を指した。",
    "options": [
      {
        "label": "魔法陣を起動する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "学園に届ける",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "灯りだけを持ち帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-023",
    "availableFrom": 1,
    "center": "こはる・しずく",
    "title": "風のエレベーター",
    "description": "校舎の階段に、風だけで上へ運ぶ見えないエレベーターが現れた。こはるは乗ってみたいと言い、しずくは行き先が毎回変わることを問題にした。",
    "options": [
      {
        "label": "行き先を計算する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "風に任せて乗る",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "階段を歩く",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-024",
    "availableFrom": 1,
    "center": "みらい・まどか",
    "title": "夢を映す自販機",
    "description": "自販機のボタンを押すと飲み物ではなく、今夜見る夢の予告が出てくる。みらいは面白がり、まどかは予告の時刻がすべて五分ずつずれていると気づいた。",
    "options": [
      {
        "label": "夢を選ぶ",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "時刻のずれを直す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "何も買わない",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-025",
    "availableFrom": 1,
    "center": "ひより・しずく",
    "title": "屋上菜園の月野菜",
    "description": "屋上菜園で、月の光を浴びた野菜が一晩で実をつけている。しずくは成長速度を測り、ひよりは食べられる状態かを一つずつ確かめる。",
    "options": [
      {
        "label": "成長記録を取る",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "みんなで収穫する",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "月光を分ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-026",
    "availableFrom": 1,
    "center": "みらい・こはる",
    "title": "校内放送の妖精",
    "description": "放送室のマイクから、校内の小さな失敗を励ます妖精の声が流れる。みらいは声の主を番組に誘い、こはるは音が風に乗って校舎全体を回る仕組みを考える。",
    "options": [
      {
        "label": "番組を続ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "風の経路を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "放送を終える",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-027",
    "availableFrom": 1,
    "center": "みらい・つばさ",
    "title": "旧校舎の音楽階段",
    "description": "旧校舎の階段を上るたび、足音が楽器の音に変わる。つばさはリズムを崩してしまい、みらいはその不器用な音にも物語があると笑った。",
    "options": [
      {
        "label": "音を合わせる",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "大きく踏み鳴らす",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "静かに上る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-028",
    "availableFrom": 1,
    "center": "あかり・みらい",
    "title": "魔法写真部の一枚",
    "description": "写真部のカメラが、撮影した人物の「今日なりたい自分」を一枚だけ写す。あかりは笑顔、みらいは舞台の上の姿が写ると思ったが、画面には別の光景が浮かんだ。",
    "options": [
      {
        "label": "写真を現像する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "全員で撮る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "カメラをしまう",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-029",
    "availableFrom": 1,
    "center": "セラ・しずく",
    "title": "星座観測会の雲",
    "description": "観測会の夜、雲が星座の形にだけ穴を開けていく。しずくは観測表を作り、セラはその穴の並びが星界の古い道標だと読む。",
    "options": [
      {
        "label": "観測表を完成させる",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "星界文字を読む",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "雲が晴れるのを待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-030",
    "availableFrom": 1,
    "center": "れい・まどか",
    "title": "先生の魔法印鑑",
    "description": "職員室の印鑑を押すと、書類の内容が一日だけ本当になるらしい。れいは危険な噂を疑い、まどかは印影の時間情報が昨日のものだと指摘した。",
    "options": [
      {
        "label": "印影を調べる",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "先生へ返す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "押さずに見守る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-031",
    "availableFrom": 2,
    "center": "あかり",
    "title": "星光リンクの試運転",
    "description": "あかりの星光が、訓練場にいる仲間の魔力を細い線でつないだ。線は強く引けば切れ、弱くすれば迷子になる。",
    "options": [
      {
        "label": "全員をつなぐ",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "一人ずつつなぐ",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "光を消して休む",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-032",
    "availableFrom": 2,
    "center": "しずく",
    "title": "月鏡の水面筆記",
    "description": "月鏡に文字を書くと、まだ起きていない出来事の候補が浮かぶ。しずくは未来を決めつけないため、書いた文字を一つずつ消していく。",
    "options": [
      {
        "label": "候補を比較する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一つを選ぶ",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "水面を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-033",
    "availableFrom": 2,
    "center": "ひより",
    "title": "花の治癒温室",
    "description": "温室の花が、近くにいる人の疲れを色として咲かせている。ひよりは一番暗い花を見つけ、自分だけでなく皆の疲れを少しずつ分けようとする。",
    "options": [
      {
        "label": "花に触れる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "色を記録する",
        "text": "`LEARNING` 成功`MAX_HP+3`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAX_HP+3"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "水を分け合う",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-034",
    "availableFrom": 2,
    "center": "つばさ",
    "title": "炎の温度テスト",
    "description": "つばさの炎が、熱さではなく「守りたい気持ち」に反応して色を変える。強く燃やすほど大きくなるが、誰かの声を聞けば静かにもできる。",
    "options": [
      {
        "label": "小さく保つ",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "最大火力を試す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "仲間の声を聞く",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-035",
    "availableFrom": 2,
    "center": "れい",
    "title": "影札の名前付け",
    "description": "れいの影札が、持ち主の名前ではなく「守ったもの」の名前を求めている。空白の札は、誰かを守った記憶がまだないらしい。",
    "options": [
      {
        "label": "守ったものを思い出す",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "仮の名前をつける",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "札を封印する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-036",
    "availableFrom": 2,
    "center": "まどか",
    "title": "時環の五分間",
    "description": "まどかの時環が、同じ五分間を三回だけ再生した。最初は失敗、次はやりすぎ、最後は小さな一歩だけを変えればよいと分かる。",
    "options": [
      {
        "label": "失敗を見直す",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "一歩だけ変える",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "再生を止める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-037",
    "availableFrom": 2,
    "center": "こはる",
    "title": "風精霊の迷子",
    "description": "風の精霊が、名前を呼ばれるたびに別の方向へ逃げていく。こはるは追いかけずに風を弱め、精霊が自分から戻れる場所を作ろうとする。",
    "options": [
      {
        "label": "風の巣を作る",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "名前を呼び続ける",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "風を休ませる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-038",
    "availableFrom": 2,
    "center": "みらい",
    "title": "夢の舞台稽古",
    "description": "舞台の上に、観客のいない客席と、まだ演じていない結末が現れた。みらいは台本を開くが、最後のページには「自分で選ぶ」としか書かれていない。",
    "options": [
      {
        "label": "即興で演じる",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "客席を照らす",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "幕を下ろす",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-039",
    "availableFrom": 2,
    "center": "セラ",
    "title": "光術の発音練習",
    "description": "セラが星界の呪文を発音すると、学園の廊下に小さな扉が一つずつ現れる。発音が少し違うだけで、扉の先が教室、星空、誰もいない場所に変わった。",
    "options": [
      {
        "label": "発音を分解する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "扉を一つ開ける",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "扉を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-040",
    "availableFrom": 2,
    "center": "9人全員",
    "title": "九属性合同実技",
    "description": "九つの属性魔法を同時に使う実技で、結界の中央に小さな虹が生まれた。だが、誰か一人が焦ると虹の順番が崩れ、全員の魔力が別の色へ流れてしまう。",
    "options": [
      {
        "label": "順番を声に出す",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "自分の属性を強くする",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "一度全員で休む",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-041",
    "availableFrom": 2,
    "center": "あかり・つばさ",
    "title": "変身後の靴ひも",
    "description": "変身を解いた後、あかりとつばさの靴ひもが魔法陣のように絡まってほどけない。急げば急ぐほど結び目が増え、笑って息を合わせると少しずつ緩んだ。",
    "options": [
      {
        "label": "手順を確認する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "力でほどく",
        "text": "`RISK:HP-5`。",
        "effects": [
          "RISK:HP-5"
        ]
      },
      {
        "label": "二人でゆっくりほどく",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-042",
    "availableFrom": 2,
    "center": "しずく・まどか",
    "title": "魔法カードの手触り",
    "description": "新しい魔法カードを触ると、紙の感触が属性ごとに変わる。しずくは違いを言葉にし、まどかは触れた順番がカード効果に影響するのではないかと考えた。",
    "options": [
      {
        "label": "感触を分類する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "時間順に並べる",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      },
      {
        "label": "カードを休ませる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-043",
    "availableFrom": 2,
    "center": "ひより・れい",
    "title": "結界の穴を縫う",
    "description": "花の結界に、影のような穴が空いている。ひよりは花糸で縫おうとし、れいは穴の向こうから誰かが結界を見ていることに気づく。",
    "options": [
      {
        "label": "穴の向こうを確認する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "花糸で閉じる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "影札で封じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-044",
    "availableFrom": 2,
    "center": "セラ・こはる",
    "title": "敵の残響を聞く",
    "description": "戦闘訓練の終わった校庭で、風に乗って敵の言葉の残響が聞こえる。「ここは何度目だ」と、誰かが繰り返していた。",
    "options": [
      {
        "label": "残響の方向を追う",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "風を散らす",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "記録だけ残す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-045",
    "availableFrom": 2,
    "center": "主人公・全員",
    "title": "魔力切れの帰り道",
    "description": "戦闘訓練の帰り、全員の変身ゲージが空になり、普段なら見えない学園の細部が見えてきた。魔法が使えない一分間だけ、誰もが普通の学生の顔をしている。",
    "options": [
      {
        "label": "歩きながら話す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "魔力の回復方法を考える",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "静かに帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-046",
    "availableFrom": 3,
    "center": "ひより・こはる",
    "title": "使い魔の朝食会",
    "description": "中庭に集まった使い魔たちが、持ち主の好きな朝食を一口ずつ交換している。好き嫌いの違いまで魔力の相性に見えるが、こはるの精霊だけは風を食べていた。",
    "options": [
      {
        "label": "食事を分ける",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "相性を観察する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "風の皿を作る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-047",
    "availableFrom": 3,
    "center": "あかり・みらい",
    "title": "使い魔の名札迷子",
    "description": "使い魔の名札が全部入れ替わり、呼びかけるたびに別の子が振り向く。あかりは一匹ずつ声をかけ、みらいは名札の文字を舞台の配役表のように並べ直す。",
    "options": [
      {
        "label": "声で呼び分ける",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`HEAL+8`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "HEAL+8"
          ]
        }
      },
      {
        "label": "名札を並べる",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "名札を外す",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-048",
    "availableFrom": 3,
    "center": "れい・まどか",
    "title": "使い魔の交換日誌",
    "description": "寮の机に、使い魔同士が書いた交換日誌が残されている。内容は「主人公が眠そう」「今日は少し無理をした」と、本人より正直な観察ばかりだった。",
    "options": [
      {
        "label": "最後のページを読む",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "返事を書く",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "日誌を閉じる",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-049",
    "availableFrom": 3,
    "center": "こはる・セラ",
    "title": "精霊樹の落ち葉便り",
    "description": "学園地下の精霊樹から、季節外れの葉が一枚届いた。葉脈は星界の地図に似ているが、こはるは地図よりも、葉が誰かを待っていることを感じ取った。",
    "options": [
      {
        "label": "葉脈を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "樹へ返す",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "押し葉にする",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-050",
    "availableFrom": 3,
    "center": "みらい・つばさ",
    "title": "変身ポーズ投票",
    "description": "学園広報のため、変身ポーズの人気投票をすることになった。みらいは舞台映えを、つばさは一番動きやすい構えを推して、真剣な顔でぶつかっている。",
    "options": [
      {
        "label": "見栄えを選ぶ",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "動きやすさを測る",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "全員の案を混ぜる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-051",
    "availableFrom": 3,
    "center": "つばさ・しずく",
    "title": "魔法商店街の値札",
    "description": "商店街の魔法道具が、値札ではなく「必要な気持ち」を表示している。炎の手袋には勇気、月鏡には待つ心、壊れた箒には謝る言葉と出ていた。",
    "options": [
      {
        "label": "必要な気持ちを選ぶ",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "値札を元に戻す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "店主の話を聞く",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-052",
    "availableFrom": 3,
    "center": "あかり・ひより",
    "title": "星菓子店の試食",
    "description": "星型の菓子を食べると、一口ごとに今日の小さな幸運が見える。あかりは皆で分けようとし、ひよりは幸運を独り占めすると味が苦くなることに気づく。",
    "options": [
      {
        "label": "分けて食べる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "幸運の意味を読む",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一つだけ持ち帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-053",
    "availableFrom": 3,
    "center": "しずく・セラ",
    "title": "月灯りの路面電車",
    "description": "夜の路面電車が、駅ではなく月の満ち欠けに合わせて停車している。しずくは次の停車駅を計算し、セラは窓の外に星界の街並みが混じる瞬間を見つける。",
    "options": [
      {
        "label": "停車順を計算する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "一駅だけ降りる",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "車内で休む",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-054",
    "availableFrom": 3,
    "center": "みらい・れい",
    "title": "夢映画館の予告編",
    "description": "映画館の予告編に、まだ誰も撮っていない「学園の終わり」が映る。みらいは夢の編集を疑い、れいは映像の隅に黒帳機関の印があると見抜いた。",
    "options": [
      {
        "label": "映像を最後まで見る",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "映写を止める",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "予告を持ち帰る",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-055",
    "availableFrom": 3,
    "center": "こはる・まどか",
    "title": "雨宿りの結界傘",
    "description": "雨の中、一本の傘だけが持ち主を守る結界を張っている。こはるが風を止めても、まどかが傘の時間を戻しても、傘は誰か一人分の空間しか空けてくれない。",
    "options": [
      {
        "label": "順番に使う",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "結界の仕組みを調べる",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "雨が止むまで待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-056",
    "availableFrom": 3,
    "center": "つばさ・あかり",
    "title": "夏祭りの術式屋台",
    "description": "夏祭りの屋台で、射的の的が魔法陣、金魚すくいの水が月の海になっている。つばさは一番難しい的を狙い、あかりは屋台の奥から聞こえる小さな助け声に気づいた。",
    "options": [
      {
        "label": "的を狙う",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "屋台の奥を手伝う",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "祭りを楽しむ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-057",
    "availableFrom": 3,
    "center": "セラ・れい",
    "title": "学園新聞の一面",
    "description": "朝刊の一面に、まだ起きていない事件の見出しが載っている。セラは星界からの予告かもしれないと考え、れいは見出しの文字数が封印の鍵になっていると指摘した。",
    "options": [
      {
        "label": "文字数を数える",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "記事を隠す",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "皆に知らせる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-058",
    "availableFrom": 3,
    "center": "れい・ひより",
    "title": "休日の魔法図書交換",
    "description": "休日の図書室で、読んだ本の記憶を一冊ずつ交換する魔法が試されている。れいの禁術書の記憶は重く、ひよりの保健ノートの記憶は温かかった。",
    "options": [
      {
        "label": "記憶を一部だけ交換する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "温かい記憶を分ける",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "本を返す",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-059",
    "availableFrom": 3,
    "center": "こはる・つばさ",
    "title": "雪だるまの魔力核",
    "description": "校庭の雪だるまに、誰かが小さな魔力核を入れたらしい。つばさは炎で溶かさずに調べたいと言い、こはるは雪だるまが春まで残りたいと願っている気配を感じた。",
    "options": [
      {
        "label": "核を観察する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "雪を補充する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "核を外す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-060",
    "availableFrom": 3,
    "center": "セラ・まどか",
    "title": "伝言を運ぶ星鳥",
    "description": "星界から来た小鳥が、短い伝言を一つだけ運べるという。行き先を間違えると、伝言は一年前の相手へ届いてしまう。",
    "options": [
      {
        "label": "宛先を計算する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "今の仲間へ送る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "星鳥を休ませる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-061",
    "availableFrom": 10,
    "center": "まどか・あかり",
    "title": "反復する朝のチャイム",
    "description": "同じ朝のチャイムが三度鳴り、三度とも教室の窓に違う景色が映る。まどかはループの中心を探し、あかりは毎回少しだけ違う友達の表情を見ている。",
    "options": [
      {
        "label": "三回分を比較する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "四度目を待つ",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "窓を閉める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-062",
    "availableFrom": 10,
    "center": "れい・セラ",
    "title": "黒帳の落書き",
    "description": "廊下の壁に、黒い帳面の切れ端が貼られている。そこには主人公たちの名前ではなく、「観測対象A」「記録対象B」とだけ書かれていた。",
    "options": [
      {
        "label": "切れ端を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "影札で燃やす",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "証拠として保管する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-063",
    "availableFrom": 10,
    "center": "しずく・まどか",
    "title": "消えない答案の赤線",
    "description": "返却された答案の赤線が、紙から机へ、机から廊下へ伸びている。しずくは間違いの場所を追い、まどかは赤線が一度も同じ場所を通っていないことに気づいた。",
    "options": [
      {
        "label": "赤線をたどる",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "答案を折りたたむ",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "正しい答えを書き直す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-064",
    "availableFrom": 10,
    "center": "ひより・こはる",
    "title": "使われていない教室",
    "description": "校舎の端に、時間割にも地図にもない教室がある。中には机が一つだけ置かれ、椅子には「次の人へ」と花が一輪置かれていた。",
    "options": [
      {
        "label": "教室を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "花を持ち帰る",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "机を動かさない",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-065",
    "availableFrom": 10,
    "center": "あかり・れい",
    "title": "名前を忘れた魔法陣",
    "description": "訓練場の魔法陣から属性名だけが消えている。あかりの星光も、れいの影札も、触れるまでは自分の名前を思い出せなかった。",
    "options": [
      {
        "label": "属性を呼び戻す",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "新しい名前をつける",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "魔法陣を消す",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-066",
    "availableFrom": 10,
    "center": "みらい・セラ",
    "title": "ノイズの混じる校内放送",
    "description": "校内放送に、普通の連絡と黒帳機関の暗号が交互に混ざっている。みらいは声の調子から本物の放送を見分け、セラはノイズの間に星界の数字を見つける。",
    "options": [
      {
        "label": "音の間隔を数える",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "放送を別の物語に変える",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "受信機を切る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-067",
    "availableFrom": 10,
    "center": "しずく・こはる",
    "title": "逆さに流れる噴水",
    "description": "中庭の噴水が空へ向かって水を流し、落ちた水だけが昨日の記憶になる。しずくは水滴を数え、こはるは風で噴水の周囲に安全な輪を作る。",
    "options": [
      {
        "label": "水滴を観測する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "風で流れを戻す",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "昨日の記憶を拾う",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-068",
    "availableFrom": 10,
    "center": "セラ・あかり",
    "title": "廊下の向こうの星界窓",
    "description": "廊下の突き当たりに、校舎の外ではなく星界を映す窓が現れた。あかりは向こうにも学園があることに気づき、セラはその学園がこちらを観測していると告げる。",
    "options": [
      {
        "label": "窓の向こうへ呼びかける",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "星の位置を記録する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "窓を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-069",
    "availableFrom": 10,
    "center": "れい・つばさ",
    "title": "影だけ遅れる",
    "description": "主人公たちの影が、本人より一秒遅れて動いている。つばさが走ると影は立ち止まり、れいが札を構えると影だけが先に敵の姿を作った。",
    "options": [
      {
        "label": "影の動きを読む",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "炎で影を照らす",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "影に話しかける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-070",
    "availableFrom": 10,
    "center": "みらい・ひより",
    "title": "夢の中の非常階段",
    "description": "眠っていないのに、非常階段だけが夢の中へ続いている。ひよりは階段の途中で誰かの泣き声を聞き、みらいはその泣き声が自分の知らない記憶から来ていると感じる。",
    "options": [
      {
        "label": "泣き声に近づく",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "夢の幕を開ける",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "階段を戻る",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-071",
    "availableFrom": 10,
    "center": "あかり・れい",
    "title": "黒帳機関の配達票",
    "description": "学園の郵便受けに、宛名のない黒い配達票が届いた。配達先は「最も記録を恐れる者」とあり、紙を持つ手によって文字が変化する。",
    "options": [
      {
        "label": "自分の名前を書く",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "れいに封印を頼む",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "配達票を返す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-072",
    "availableFrom": 10,
    "center": "まどか・9人全員",
    "title": "破れた変身記録",
    "description": "変身の瞬間だけを記録した映像が、途中で破れている。まどかは破れた箇所が全員で違うことを確かめ、仲間たちは自分に見えなかった部分を伝え合う。",
    "options": [
      {
        "label": "映像をつなぎ直す",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "自分の記憶を書き足す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "記録を削除する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-073",
    "availableFrom": 10,
    "center": "しずく・ひより",
    "title": "封じられた学習机",
    "description": "廃教室の机に座ると、解けなかった問題だけが机の表面へ浮かぶ。しずくは答えの構造を整理し、ひよりは間違えた自分を責めないよう隣に座る。",
    "options": [
      {
        "label": "問題を解き直す",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`HEAL+8`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "HEAL+8"
          ]
        }
      },
      {
        "label": "机の封印を調べる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "問題を閉じる",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGE-074",
    "availableFrom": 10,
    "center": "れい・セラ",
    "title": "深層図書館の返却期限",
    "description": "深層図書館から、返した覚えのない本の返却期限が届いた。期限の日付は第50章の先にあり、セラは星界の暦、れいは黒帳機関の記録方式を疑う。",
    "options": [
      {
        "label": "期限を解読する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "本を探す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "期限を破る",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-075",
    "availableFrom": 10,
    "center": "9人全員",
    "title": "もう一度だけの放課後",
    "description": "夕暮れの校門で、全員が「今日をもう一度やり直せたら」と思った瞬間、校舎の時計が止まった。やり直せるのは一つの会話だけで、選び直した言葉は次の周回まで残る。",
    "options": [
      {
        "label": "誰かに謝る",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`HEAL+8`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "HEAL+8"
          ]
        }
      },
      {
        "label": "言えなかった感謝を伝える",
        "text": "`MAX_HP+3`。",
        "effects": [
          "MAX_HP+3"
        ]
      },
      {
        "label": "やり直さず帰る",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-076",
    "availableFrom": 51,
    "center": "あかり",
    "title": "51回目の朝",
    "description": "第50章を越えた朝、校門はいつも通り開いたのに、掲示板の日付だけが空白になっている。あかりは「何回目でも、今日を始める」と言い、空白の上に星を一つ描く。",
    "options": [
      {
        "label": "新しい日付を書く",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`MAGIC_TRACE+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "MAGIC_TRACE+1"
          ]
        }
      },
      {
        "label": "空白を残す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "仲間を呼ぶ",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-077",
    "availableFrom": 51,
    "center": "まどか・しずく",
    "title": "章のない時間割",
    "description": "時間割から章番号だけが消え、授業は「最初」「途中」「最後」とだけ表示されている。まどかは時間の輪郭を測り、しずくは章がなくても問題の順序は残っていると気づく。",
    "options": [
      {
        "label": "順序を組み直す",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "途中の授業を選ぶ",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "休み時間にする",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-078",
    "availableFrom": 51,
    "center": "こはる・セラ",
    "title": "空に浮く学園の影",
    "description": "空を見上げると、雲の上にもう一つの学園の影が浮かんでいる。セラは星界側の校舎、こはるは精霊樹の記憶が作った場所だと考え、影から落ちる葉を受け止めた。",
    "options": [
      {
        "label": "影への道を探す",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "葉を精霊樹へ返す",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "空を記録する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-079",
    "availableFrom": 51,
    "center": "セラ・あかり",
    "title": "逆向きの星座",
    "description": "夜空の星座が、見慣れた形と反対向きに並んでいる。セラは「向こう側から見た空」だと告げ、あかりは星の並びをひっくり返して、学園へ戻る道を探す。",
    "options": [
      {
        "label": "星座を反転して読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "星光で道を照らす",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "夜明けまで待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGE-080",
    "availableFrom": 51,
    "center": "9人全員",
    "title": "全員分の空席",
    "description": "教室に9つの空席があり、そこへ座ると別の世界の自分が一人ずつ映る。誰もが少し違う選択をしていたが、机の上には同じ魔法カードが置かれていた。",
    "options": [
      {
        "label": "隣の自分と話す",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "カードを持ち帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "席を空けたままにする",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-081",
    "availableFrom": 51,
    "center": "つばさ・ひより",
    "title": "魔法のない一分間",
    "description": "校舎全体から魔法が消え、炎も花も光もただの色になった。つばさは拳を握り、ひよりは魔法がなくても誰かを助ける方法があると、保健室の灯りをつける。",
    "options": [
      {
        "label": "手を動かして助ける",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "魔法が戻る条件を考える",
        "text": "`LEARNING` 成功`MAX_HP+3`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAX_HP+3"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一分間を受け入れる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-082",
    "availableFrom": 51,
    "center": "れい・セラ",
    "title": "黒帳の観測者",
    "description": "図書室の高窓から、黒い帳面を持つ人影がこちらを見ている。追いかけても姿はなく、机の上に「記録する者もまた、記録される」と一文だけ残っていた。",
    "options": [
      {
        "label": "一文を封印する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "観測者へ問い返す",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "文章を仲間と共有する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-083",
    "availableFrom": 51,
    "center": "みらい",
    "title": "夢の中の真エンドロール",
    "description": "眠りに落ちていないのに、講堂のスクリーンへ「終」の文字が流れ始める。みらいが幕を止めると、終わりの次にまだ何も撮られていない場面が待っていた。",
    "options": [
      {
        "label": "次の場面を演じる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "観客席を照らす",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "エンドロールを見届ける",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-084",
    "availableFrom": 51,
    "center": "9属性全員",
    "title": "消えた属性色",
    "description": "訓練場の属性ランプから、星・月・花・炎・闇・時・風・夢・光の色が一つずつ消えていく。色を戻すには、強い魔法ではなく、その属性が守ってきた日常を思い出す必要がある。",
    "options": [
      {
        "label": "属性の思い出を語る",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`HEAL+8`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "HEAL+8"
          ]
        }
      },
      {
        "label": "全属性を同時に放つ",
        "text": "`RISK:HP-5`。",
        "effects": [
          "RISK:HP-5"
        ]
      },
      {
        "label": "消えた色を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-085",
    "availableFrom": 51,
    "center": "セラ",
    "title": "星界からの返事",
    "description": "セラがこれまで送った光の信号に、初めて返事が届いた。返事は短く、「帰る場所を一つに決めなくていい」とだけ書かれている。",
    "options": [
      {
        "label": "返事を読み解く",
        "text": "`LEARNING` 成功`MAX_HP+3`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAX_HP+3"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "返事を仲間に見せる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "返信を送る",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-086",
    "availableFrom": 51,
    "center": "あかり・まどか",
    "title": "ループの外の購買部",
    "description": "存在しないはずの購買部に、これまでの周回で選ばなかった道具だけが並んでいる。あかりは全部試したいと言い、まどかは選ばなかったこと自体が記録になっていると説明する。",
    "options": [
      {
        "label": "一つだけ選ぶ",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "未選択の履歴を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "何も買わずに戻る",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGE-087",
    "availableFrom": 51,
    "center": "こはる・れい",
    "title": "学園地下の未登録扉",
    "description": "精霊樹の根元に、地図にない扉がある。扉には風でしか読めない文字と、影札でしか見えない鍵穴が刻まれていた。",
    "options": [
      {
        "label": "風と影を合わせる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "扉を封印する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "誰かを呼んでから開ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-088",
    "availableFrom": 51,
    "center": "9人全員",
    "title": "九人の魔法陣",
    "description": "9人が別々の場所にいるのに、足元へ同じ魔法陣が浮かぶ。誰か一人の魔力を強めると他の8人の線が薄くなり、全員が少しずつ力を分けると中央に新しい紋章が生まれる。",
    "options": [
      {
        "label": "一人に集める",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "全員で分ける",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "魔法陣を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-089",
    "availableFrom": 51,
    "center": "9人全員",
    "title": "ノクスの記録片",
    "description": "戦闘後の床に、零号記録者ノクスのものと思われる記録片が落ちている。そこには勝敗ではなく、主人公たちが笑った場面、迷った場面、学び直した場面が順番に記録されていた。",
    "options": [
      {
        "label": "記録を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "記録を書き換える",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      },
      {
        "label": "記録片を仲間へ渡す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGE-090",
    "availableFrom": 51,
    "center": "9人全員",
    "title": "明日を選ぶ鐘",
    "description": "学園の鐘が、過去の始業ではなく「まだ来ていない明日」を告げている。鐘を鳴らすたびに別の世界の朝が見えるが、最後に残るのは、主人公たちが自分で選んだ一つの景色だけだった。",
    "options": [
      {
        "label": "仲間と一緒に鳴らす",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`＋`TEAM+1`／失敗`HEAL+12`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1",
            "TEAM+1"
          ],
          "failureEffects": [
            "HEAL+12"
          ]
        }
      },
      {
        "label": "自分だけで鳴らす",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "鐘を鳴らさず朝を待つ",
        "text": "`MAX_HP+3`。",
        "effects": [
          "MAX_HP+3"
        ]
      }
    ]
  }
];

export const MAGIC_ENDLESS_MALE_EVENTS: MagicEndlessEventDefinition[] = [
  {
    "id": "MGEM-001",
    "availableFrom": 1,
    "center": "蓮",
    "title": "風でほどける靴ひも",
    "description": "登校中、蓮の靴ひもだけが何度も風にほどかれる。結び直すたび、校門の先にいる誰かの声が近づいてくる。",
    "options": [
      {
        "label": "風の向きを読む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "急いで結び直す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "声の方へ進む",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-002",
    "availableFrom": 1,
    "center": "颯真",
    "title": "生徒会長室の凍った印",
    "description": "生徒会長室の承認印が氷に閉じ込められ、押された書類だけが昨日の日付へ戻っている。颯真は全書類を机に並べた。",
    "options": [
      {
        "label": "印の順番を調べる",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "氷を割らずに待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "承認印を封じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-003",
    "availableFrom": 1,
    "center": "湊",
    "title": "水槽の居残り魚",
    "description": "生物室の水槽で、授業が終わっても一匹の魚だけが泳ぎ続けている。湊が近づくと、水面に誰かの忘れ物の場所が映った。",
    "options": [
      {
        "label": "水面の像を追う",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "魚を落ち着かせる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "先生へ報告する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-004",
    "availableFrom": 1,
    "center": "理玖",
    "title": "一年遅れの部活動申請",
    "description": "部活動の申請箱から、去年の日付の申請書が一枚だけ出てきた。理玖は紙の時間が遅れたのか、学校の記録が先走ったのかを考える。",
    "options": [
      {
        "label": "日付を照合する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "申請を受け付ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "箱を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-005",
    "availableFrom": 1,
    "center": "大和",
    "title": "壊れたロッカーの拳跡",
    "description": "男子寮のロッカーに、誰かの拳跡だけが残っている。大和は自分のものではないと言い張るが、へこんだ金属の奥から小さな炎が漏れていた。",
    "options": [
      {
        "label": "拳跡の魔力を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "ロッカーを直す",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      },
      {
        "label": "炎を外へ逃がす",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-006",
    "availableFrom": 1,
    "center": "レオン",
    "title": "音楽室の勝負宣言",
    "description": "音楽室の楽器が、レオンの名前を呼ぶように一音ずつ鳴る。レオンは誰もいない部屋へ向かい、勝負の相手が自分の幻だと見抜いた。",
    "options": [
      {
        "label": "音の間隔を読む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "正面から演奏する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "楽器を休ませる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-007",
    "availableFrom": 1,
    "center": "エリオット",
    "title": "転校届のない席",
    "description": "教室の最後列に、転校届の記録がない机が一つ増えている。エリオットが座ると、机の中から星界の切符と見知らぬ校章が現れた。",
    "options": [
      {
        "label": "校章を観測する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "切符を保管する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "先生へ届ける",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      }
    ]
  },
  {
    "id": "MGEM-008",
    "availableFrom": 1,
    "center": "朔夜",
    "title": "放課後の封印清掃",
    "description": "放課後の廊下掃除をしていると、古い封印札が床の汚れに混ざっている。朔夜は見なかったことにできるが、札の裏から学園の鐘の音が聞こえた。",
    "options": [
      {
        "label": "札の裏を確認する",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "新しい札を重ねる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "誰にも見せず片づける",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-009",
    "availableFrom": 1,
    "center": "蓮・あかり",
    "title": "幼なじみの交換日記",
    "description": "蓮の机に、書いた覚えのない交換日記が置かれている。ページをめくると、今日まだ起きていない会話が風に揺れる文字ではなく、光の記号で記録されていた。",
    "options": [
      {
        "label": "会話の順番を確かめる",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "今日の一行を書く",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "日記を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-010",
    "availableFrom": 1,
    "center": "颯真・しずく",
    "title": "生徒会議の二重議事録",
    "description": "生徒会の議事録が二冊あり、同じ会議なのに決定事項が異なっている。颯真は正式な記録を選び、しずくは二冊とも本物だと指摘する。",
    "options": [
      {
        "label": "記録を比較する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "両方を保管する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "片方を破棄する",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      }
    ]
  },
  {
    "id": "MGEM-011",
    "availableFrom": 1,
    "center": "湊・ひより",
    "title": "保健室前の水滴",
    "description": "保健室の前に、誰も歩いていないのに水滴の跡が続いている。湊は足跡の終点で、疲れを隠している小さな使い魔を見つけた。",
    "options": [
      {
        "label": "水滴の経路をたどる",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "使い魔に水を分ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "保健室へ連れていく",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-012",
    "availableFrom": 1,
    "center": "理玖・まどか",
    "title": "先輩の置き時計",
    "description": "理玖が教室に置いていった時計が、毎時一分だけ別の時刻を示す。まどかは故障ではなく、時計が誰かの待ち時間を数えていると考えた。",
    "options": [
      {
        "label": "一分の差を記録する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "時計を巻き戻す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "持ち主を待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-013",
    "availableFrom": 1,
    "center": "大和・つばさ",
    "title": "体育倉庫の炎球",
    "description": "体育倉庫の奥で、ボールの形をした炎が跳ねている。大和は受け止めようとし、つばさは炎が怒っているのではなく、外へ出たいだけだと気づく。",
    "options": [
      {
        "label": "軌道を読む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "外へ蹴り出す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "炎を小さくする",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-014",
    "availableFrom": 1,
    "center": "レオン・みらい",
    "title": "音のない発表会",
    "description": "発表会の舞台に立つと、レオンの声も観客の拍手も消えてしまう。みらいは無音の中でも表情と動きは届くと言い、レオンは演奏を続ける。",
    "options": [
      {
        "label": "無音の拍を数える",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "幻の観客を作る",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "舞台を降りる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-015",
    "availableFrom": 1,
    "center": "エリオット・セラ",
    "title": "星界式の出欠",
    "description": "出席簿の名前の横に、星界式の小さな光が順番に灯る。エリオットは光の色から別世界の出席者を数え、セラはこの学園が二つの教室を重ねていると読む。",
    "options": [
      {
        "label": "光の順序を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "出席簿を閉じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "光を仲間へ分ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-016",
    "availableFrom": 1,
    "center": "蓮・こはる",
    "title": "風の通学路",
    "description": "放課後の帰り道だけ、校門から男子寮までの風向きが毎日変わる。蓮は迷う後輩を風で導き、こはるは風の先に精霊樹の匂いを感じる。",
    "options": [
      {
        "label": "風向きを地図にする",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "迷子を送る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "風が止むまで休む",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-017",
    "availableFrom": 1,
    "center": "颯真・セラ",
    "title": "校則を書き換える雪",
    "description": "生徒会掲示板に積もった雪が、触れた校則だけを別の内容へ変えていく。颯真は規則を守ろうとし、セラは雪が星界の翻訳を試していると説明する。",
    "options": [
      {
        "label": "元の規則を照合する",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "雪を溶かす",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "意味を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-018",
    "availableFrom": 1,
    "center": "湊・ひより",
    "title": "水路の迷子",
    "description": "校舎の排水路から、小さな水の使い魔が校内地図を逆さにして運んでくる。湊は水の流れを追い、ひよりは使い魔が帰る場所を探していると気づく。",
    "options": [
      {
        "label": "流路を計算する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "水路を安全にする",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "地図を元に戻す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-019",
    "availableFrom": 1,
    "center": "理玖・みらい",
    "title": "夕方が来ない中庭",
    "description": "中庭だけが昼のままで、校舎の窓には夜の教室が映っている。理玖は時間の境目を測り、みらいは昼と夜のどちらにも居場所がある舞台を作ろうとする。",
    "options": [
      {
        "label": "影の長さを測る",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "舞台の照明を合わせる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "中庭を出る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-020",
    "availableFrom": 1,
    "center": "大和・つばさ",
    "title": "購買部の焦げたパン",
    "description": "購買部のパンが一つだけ焦げており、触れると小さな炎拳の跡が浮かぶ。大和は売り物にならないと言うが、つばさは火加減の練習に使えると持ち上げる。",
    "options": [
      {
        "label": "焦げ方を調べる",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "食べられる部分を分ける",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "新しいパンを焼く",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGEM-021",
    "availableFrom": 1,
    "center": "レオン・しずく",
    "title": "音程を測る月鏡",
    "description": "月鏡を鳴らすと、音程に合わせて表面の模様が変わる。レオンは正しい音を当てようとし、しずくは音の高さが月の満ち欠けと対応していると整理する。",
    "options": [
      {
        "label": "音と月の対応を読む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一番高い音を鳴らす",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "鏡を伏せる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-022",
    "availableFrom": 1,
    "center": "エリオット・れい",
    "title": "図書室の返却鍵",
    "description": "図書室の返却箱から、星の刻印と影の刻印がある二本の鍵が出てくる。エリオットは星界の棚を、れいは封印された棚を疑った。",
    "options": [
      {
        "label": "鍵の組み合わせを調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "司書へ渡す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "鍵を封じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-023",
    "availableFrom": 1,
    "center": "朔夜・れい",
    "title": "旧礼拝堂の二重封印",
    "description": "旧礼拝堂の扉に、朔夜の封印とれいの影札が別々の方向を向いて貼られている。扉の内側から、敵味方の区別がない呼び声がした。",
    "options": [
      {
        "label": "二つの封印を重ねる",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "呼び声を聞く",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "扉を補強する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-024",
    "availableFrom": 1,
    "center": "蓮・あかり・こはる",
    "title": "風の応援旗",
    "description": "体育祭の応援旗が風に乗って校舎の外へ飛び、三人の魔法をつないだときだけ戻ってくる。蓮は旗を守り、あかりは光で道を示し、こはるは風の流れを整える。",
    "options": [
      {
        "label": "三つの魔法を合わせる",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "旗を追いかける",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "風が弱まるのを待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-025",
    "availableFrom": 1,
    "center": "颯真・まどか",
    "title": "生徒会倉庫の停止時計",
    "description": "生徒会倉庫の時計が止まり、倉庫内の備品だけが停止前の状態へ戻り続けている。颯真は在庫を確認し、まどかは巻き戻りの中心を探す。",
    "options": [
      {
        "label": "備品の数を照合する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "時計を外す",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      },
      {
        "label": "時間の中心を封じる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-026",
    "availableFrom": 1,
    "center": "湊・セラ",
    "title": "水面に映る別校舎",
    "description": "中庭の噴水に、実際には存在しない別の校舎が映っている。湊が水面を整えると、セラはその校舎の窓に星界の記録室を見つけた。",
    "options": [
      {
        "label": "映像の位置を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "水面を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "別校舎へ光を送る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-027",
    "availableFrom": 1,
    "center": "理玖・しずく",
    "title": "講義室の空席番号",
    "description": "講義室の座席番号が一つずつ消え、空席に座ると一時間前の授業が聞こえてくる。理玖は時間を戻さず、しずくは消えた番号の規則を探す。",
    "options": [
      {
        "label": "番号の並びを解く",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "授業の記憶を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "席を離れる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-028",
    "availableFrom": 1,
    "center": "大和・ひより",
    "title": "屋上の保護柵",
    "description": "屋上の保護柵が、近づく人を外へ押し出すのではなく、危険から遠ざけるように動いている。大和は力で止めようとし、ひよりは柵が守り方を知らないだけだと考える。",
    "options": [
      {
        "label": "動く範囲を測る",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "柵を補修する",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "安全な道を示す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-029",
    "availableFrom": 1,
    "center": "レオン・みらい",
    "title": "文化祭の無音舞台",
    "description": "文化祭の舞台に立つと、観客はいるのに音だけが存在しない。レオンは幻術で舞台を彩り、みらいは無音の物語を最後まで演じる。",
    "options": [
      {
        "label": "拍手のない間を読む",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "幻の音を加える",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "舞台を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-030",
    "availableFrom": 1,
    "center": "エリオット・セラ",
    "title": "図工室の星砂",
    "description": "図工室の砂箱に、夜空の星を細かく砕いたような砂が混ざっている。エリオットは砂を星界へ戻す方法を知っているが、セラは学園に残す意味もあると考える。",
    "options": [
      {
        "label": "砂の座標を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "小瓶に分ける",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "砂を星へ返す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-031",
    "availableFrom": 2,
    "center": "蓮",
    "title": "風壁の守備訓練",
    "description": "訓練場の風壁が、攻撃を防ぐたびに一人分だけ薄くなる。蓮は自分が盾になるのではなく、全員で壁を支える方法を選ぶ。",
    "options": [
      {
        "label": "風壁を分担する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "最大出力で張る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "訓練を休む",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGEM-032",
    "availableFrom": 2,
    "center": "颯真",
    "title": "氷律の行列",
    "description": "氷の魔法具が、順番を守った者だけを次の訓練区画へ通す。颯真は先頭に立てるが、最後の一人が追いつくまで列を動かさない。",
    "options": [
      {
        "label": "順序の規則を解く",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "全員の歩幅を合わせる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "氷具を解除する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-033",
    "availableFrom": 2,
    "center": "湊",
    "title": "水治癒のタイムリミット",
    "description": "湊の水治癒が、傷を治すたびに数秒だけ早く消えていく。治す順番を誤ると、最後の一人に水が届かない。",
    "options": [
      {
        "label": "治癒の順番を組む",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "自分の治癒を後回しにする",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "水を一度止める",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGEM-034",
    "availableFrom": 2,
    "center": "理玖",
    "title": "未来を観測する黒板",
    "description": "黒板に、まだ起きていない訓練の失敗だけが先に書かれている。理玖は未来を避けるのではなく、失敗の条件を記録して仲間へ渡す。",
    "options": [
      {
        "label": "条件を整理する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "別の未来を試す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "黒板を消す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-035",
    "availableFrom": 2,
    "center": "大和",
    "title": "炎拳の力加減",
    "description": "大和の炎拳が、強く打つほど標的を守る結界まで壊してしまう。大和は勝つ力ではなく、止める力を覚えようとする。",
    "options": [
      {
        "label": "打撃の強さを調整する",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "拳を使わず押し返す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "炎を消す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-036",
    "availableFrom": 2,
    "center": "レオン",
    "title": "幻奏の二重詠唱",
    "description": "レオンが奏でる音に、本人の声ではない二つ目の旋律が重なっている。旋律は勝負を挑むようで、レオンは相手を消すのではなく自分の音を重ねる。",
    "options": [
      {
        "label": "旋律の差を読む",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "二つの音を競わせる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "演奏を止める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-037",
    "availableFrom": 2,
    "center": "エリオット",
    "title": "星界座標の誤差",
    "description": "星界への座標を描くと、線が毎回少しだけ学園の外側へずれる。エリオットは誤差を失敗とせず、別の世界が近づいている証拠として記録する。",
    "options": [
      {
        "label": "誤差を再計算する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "座標を固定する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "ずれた先を観測する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-038",
    "availableFrom": 2,
    "center": "朔夜",
    "title": "封印の余白",
    "description": "朔夜の封印式には、書かれていない余白が一つだけある。余白へ何かを加えれば強くなるが、消したものを戻す余地がなくなる。",
    "options": [
      {
        "label": "余白の意味を読む",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "新しい印を加える",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "余白を残す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-039",
    "availableFrom": 2,
    "center": "蓮・つばさ",
    "title": "風と炎の合同走",
    "description": "風の防護と炎の推進を合わせる訓練で、速く走るほど足元の結界が薄くなる。蓮はつばさを止める役を引き受け、つばさは止まる合図を信じる。",
    "options": [
      {
        "label": "速度と防護を調整する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "全速力で駆け抜ける",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "歩いて進む",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-040",
    "availableFrom": 2,
    "center": "颯真・しずく",
    "title": "月氷の反射試験",
    "description": "颯真の氷壁に月光を当てると、反射した像が少しずつ違う答えを映す。しずくは正解を一つに決めず、反射の条件を整理する。",
    "options": [
      {
        "label": "反射角を調べる",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "氷壁を曇らせる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "全ての像を記録する",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-041",
    "availableFrom": 2,
    "center": "湊・ひより",
    "title": "治癒水の分配",
    "description": "治癒水が一人分しかないのに、訓練場には複数の負傷した使い魔がいる。湊は水を薄め、ひよりは治癒の強さより順番が大切だと考える。",
    "options": [
      {
        "label": "治癒量を分けて計算する",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一番弱い使い魔へ渡す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "水を保存する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-042",
    "availableFrom": 2,
    "center": "理玖・まどか",
    "title": "ずれる秒針の実験",
    "description": "実験室の秒針が、理玖の観測とまどかの時計で別々に進む。二人が同じ瞬間を選んだときだけ、停止した時間の中に短い通路が現れる。",
    "options": [
      {
        "label": "二つの時計を同期する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "通路を一度だけ使う",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "実験を終了する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-043",
    "availableFrom": 2,
    "center": "大和・あかり",
    "title": "星火の連携",
    "description": "大和の炎にあかりの星光が触れると、火花が小さな道標になる。大和は先に進みたがり、あかりは道標が全員分そろうまで待つ。",
    "options": [
      {
        "label": "火花の順番を読む",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "道標を一気に灯す",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "炎を小さく保つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-044",
    "availableFrom": 2,
    "center": "レオン・みらい",
    "title": "幻舞台の観客",
    "description": "訓練場に幻の観客席が現れ、座った人の期待だけが舞台へ流れ込む。レオンは完璧な演目を、みらいは失敗を含めた本当の演目を選ぼうとする。",
    "options": [
      {
        "label": "観客の期待を分析する",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "即興で演じる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "観客席を消す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-045",
    "availableFrom": 2,
    "center": "朔夜・れい",
    "title": "影札の裏面",
    "description": "影札の裏面に、表からは読めない封印の履歴が積み重なっている。朔夜は過去を隠すために使えたが、れいは履歴を残すことが次の封印になると言う。",
    "options": [
      {
        "label": "履歴の順番を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "札を焼却する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "裏面を写し取る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-046",
    "availableFrom": 3,
    "center": "蓮・こはる",
    "title": "精霊犬の散歩",
    "description": "精霊犬が散歩のたびに違う道を選び、男子寮へ戻るころには新しい風の道ができている。蓮は首輪を持ち、こはるは犬が案内したい場所を読む。",
    "options": [
      {
        "label": "道の分岐を記録する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "犬についていく",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "寮へ戻る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-047",
    "availableFrom": 3,
    "center": "颯真・しずく",
    "title": "氷菓の保存魔法",
    "description": "魔法街の氷菓店で、商品が溶けずに昨日の味を保っている。颯真は店の規則を確認し、しずくは保存魔法が時間ではなく記憶を止めていると推測する。",
    "options": [
      {
        "label": "保存条件を計算する",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "一つを皆で分ける",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "魔法を解除する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-048",
    "availableFrom": 3,
    "center": "湊・ひより",
    "title": "水辺の使い魔診療",
    "description": "魔法街の水路に、治癒を受けるたびに透明になる使い魔がいる。湊は水の濃さを調整し、ひよりは透明になることが消えることではないと声をかける。",
    "options": [
      {
        "label": "治癒の濃度を調べる",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "水路を休ませる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "使い魔を寮へ連れていく",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-049",
    "availableFrom": 3,
    "center": "理玖・まどか",
    "title": "古時計店の一分",
    "description": "古時計店に、どの時計にも存在しない「一分」だけを売る瓶が並んでいる。理玖は買う前に用途を尋ね、まどかは瓶の中で時間が眠っていると気づく。",
    "options": [
      {
        "label": "一分の使い道を比較する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "一分を戦闘用に保存する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "瓶を返す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-050",
    "availableFrom": 3,
    "center": "大和・つばさ",
    "title": "魔法街の腕相撲",
    "description": "魔法街の屋台で、腕相撲に勝つと属性色の飴がもらえる。大和は力で勝とうとするが、相手の腕には勝負を楽しみたい炎が宿っていた。",
    "options": [
      {
        "label": "力の向きを読む",
        "text": "`LEARNING` 成功`GOLD+30`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "GOLD+30"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "正面から勝負する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "飴を皆で分ける",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-051",
    "availableFrom": 3,
    "center": "レオン・みらい",
    "title": "幻術映画館",
    "description": "映画館のスクリーンに、まだ撮影されていない魔法映画が流れている。レオンは演出の粗を探し、みらいは登場人物が観客へ助けを求めていると感じる。",
    "options": [
      {
        "label": "場面転換を分析する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "スクリーンへ声を送る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "上映を止める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-052",
    "availableFrom": 3,
    "center": "エリオット・セラ",
    "title": "星界市場の切符",
    "description": "魔法街の市場で、星界行きの切符が一枚だけ地面に落ちている。エリオットは切符を持つ資格を知っているが、セラは二人で読めば帰り道も見つかると言う。",
    "options": [
      {
        "label": "切符の座標を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "市場の窓口へ届ける",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "切符を破らず保管する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-053",
    "availableFrom": 3,
    "center": "朔夜・れい",
    "title": "夜市の封印札",
    "description": "夜市の屋台で売られる封印札が、買い手の手ではなく売り手の影へ貼りついている。朔夜は札を剥がせるが、剥がすと影の記憶もこぼれ落ちる。",
    "options": [
      {
        "label": "札の目的を読む",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "影を守る結界を張る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "札を買い取る",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGEM-054",
    "availableFrom": 3,
    "center": "蓮・あかり",
    "title": "雨宿りの風屋根",
    "description": "魔法街に突然雨が降り、蓮の風が一人分の屋根を作る。あかりの星光を重ねると屋根を広げられるが、風の制御が難しくなる。",
    "options": [
      {
        "label": "屋根の広げ方を計算する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "一人ずつ屋根を渡す",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "雨の中を走る",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      }
    ]
  },
  {
    "id": "MGEM-055",
    "availableFrom": 3,
    "center": "颯真・生徒会",
    "title": "大掃除の雪像",
    "description": "学園の大掃除で集めた雪が、生徒会の議事録に登場した人物の姿へ固まっていく。颯真は壊さずに移動させ、全員の役割を決める。",
    "options": [
      {
        "label": "雪像の順番を照合する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "中庭へ運ぶ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      },
      {
        "label": "雪を溶かして片づける",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-056",
    "availableFrom": 3,
    "center": "湊・こはる",
    "title": "夏の水路",
    "description": "夏の学園祭で、水路が校舎の外ではなく空へ水を運んでいる。湊は水を戻そうとし、こはるは風が水路の出口を見失わせていると気づく。",
    "options": [
      {
        "label": "水と風の流れを読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "水路に花を浮かべる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "空への水を見送る",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-057",
    "availableFrom": 3,
    "center": "理玖・セラ",
    "title": "流星の届く商店街",
    "description": "商店街の上空を流星がゆっくり通り、落ちた場所の商品だけが一日前の状態へ戻る。理玖は落下時刻を測り、セラは流星が星界からの便だと読む。",
    "options": [
      {
        "label": "落下時刻を観測する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "商店を手伝う",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "流星を空へ返す",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-058",
    "availableFrom": 3,
    "center": "大和・ひより",
    "title": "秋祭りの火守り",
    "description": "秋祭りの灯籠の炎が、近づく人の不安だけを拾って暗くなる。大和は炎を守り、ひよりは不安を言葉にして小さく分ける。",
    "options": [
      {
        "label": "炎の明るさを調整する",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "火守りを交代する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "灯籠を消す",
        "text": "`GOLD+20`。",
        "effects": [
          "GOLD+20"
        ]
      }
    ]
  },
  {
    "id": "MGEM-059",
    "availableFrom": 3,
    "center": "レオン・セラ",
    "title": "冬の音符灯",
    "description": "冬の街路樹に吊られた音符灯が、鳴らされなかった音だけを光らせている。レオンは不足した旋律を探し、セラは光の列が星界の帰路を示していると気づく。",
    "options": [
      {
        "label": "音の抜けを埋める",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "灯りを皆へ分ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "光を消さずに見守る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-060",
    "availableFrom": 3,
    "center": "エリオット・朔夜",
    "title": "季節外れの星門",
    "description": "魔法街の外れに、季節の違う景色へ通じる星門が現れる。エリオットは星界の門、朔夜は封印の抜け道と判断し、どちらも一人では閉じられないと認める。",
    "options": [
      {
        "label": "門の開閉条件を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "二重封印する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "仲間を呼ぶ",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-061",
    "availableFrom": 10,
    "center": "蓮・颯真",
    "title": "二つの出席簿",
    "description": "職員室の出席簿に、男子寮の生徒が二重に記録されている。一冊は今日の出席を、もう一冊は存在しなかった朝の出席を示していた。",
    "options": [
      {
        "label": "二冊の差分を確認する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "正式な一冊を保管する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "二冊を重ねて封じる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-062",
    "availableFrom": 10,
    "center": "颯真・理玖",
    "title": "生徒会の存在しない議事室",
    "description": "生徒会室の隣に、校舎図面にはない議事室が現れる。中では理玖がまだ参加していない会議の議事録を読み、颯真の署名だけが何度も書き直されている。",
    "options": [
      {
        "label": "議事録の時刻を照合する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "署名を消す",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "会議を始める",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-063",
    "availableFrom": 10,
    "center": "湊・エリオット",
    "title": "水底の校章",
    "description": "地下水路の底に、学園の校章が沈んでいる。湊が水を澄ませると、エリオットは校章がこちらの学園ではなく、星界側の同じ学校のものだと気づいた。",
    "options": [
      {
        "label": "校章の違いを調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "水底へ返す",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "学園へ持ち帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-064",
    "availableFrom": 10,
    "center": "理玖・まどか",
    "title": "進まない五分",
    "description": "時計塔の針が五分間だけ動かず、その間にだけ存在する階段が現れる。理玖は急がず、まどかは五分が終わる前に階段の構造を記録する。",
    "options": [
      {
        "label": "五分の中の変化を測る",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "階段を下りる",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "時計を待つ",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-065",
    "availableFrom": 10,
    "center": "大和・朔夜",
    "title": "破れた訓練標",
    "description": "地下訓練場の標的に、大和の炎拳と朔夜の封印の跡が同時に残っている。二人が戦った記録のようだが、本人たちには覚えがない。",
    "options": [
      {
        "label": "跡の順番を読み取る",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "標的を燃やして消す",
        "text": "`GOLD+30`。",
        "effects": [
          "GOLD+30"
        ]
      },
      {
        "label": "新しい標的を立てる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-066",
    "availableFrom": 10,
    "center": "レオン・れい",
    "title": "誰もいない合唱室",
    "description": "合唱室に入ると、誰もいないのに低い歌声が響く。レオンは音源を探し、れいは歌声の中に黒帳機関の封印文を見つける。",
    "options": [
      {
        "label": "声の重なりを解く",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "歌声へ返歌する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "扉を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-067",
    "availableFrom": 10,
    "center": "エリオット・セラ",
    "title": "星界から逆流する校内地図",
    "description": "学園の地図に、星界側から逆向きの廊下が伸びてくる。エリオットは地図を折りたたみ、セラは折り目が二つの世界の境界になると読む。",
    "options": [
      {
        "label": "地図の向きを反転して読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "折り目を光で固定する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "地図を焼却する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-068",
    "availableFrom": 10,
    "center": "朔夜・れい",
    "title": "黒帳の空白名簿",
    "description": "黒い帳面に男子主人公8人分の空欄が並び、名前を書いた瞬間に一人の記憶が薄くなる。朔夜は書かないことを選び、れいは空欄そのものを記録する。",
    "options": [
      {
        "label": "空欄の規則を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "名簿を封じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "仲間の名前を声に出す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-069",
    "availableFrom": 10,
    "center": "蓮・こはる",
    "title": "風のない地下庭",
    "description": "学園地下の庭から風だけが消え、植物の葉が音もなく同じ方向へ傾いている。蓮は声を届ける風を探し、こはるは精霊樹が沈黙しているのではなく、聞き分けていると感じる。",
    "options": [
      {
        "label": "葉の傾きを調べる",
        "text": "`LEARNING` 成功`HEAL+12`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "HEAL+12"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "声を風に乗せる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "庭を静かに出る",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-070",
    "availableFrom": 10,
    "center": "颯真・しずく",
    "title": "氷壁の向こうの解答",
    "description": "氷壁の向こうに、まだ解いていない問題の答えだけが浮かんでいる。颯真は答えを持ち帰る誘惑を抑え、しずくは解答へ至る条件だけを写し取る。",
    "options": [
      {
        "label": "条件を組み立て直す",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "答えを持ち帰る",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "氷壁を閉じる",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-071",
    "availableFrom": 10,
    "center": "湊・ひより",
    "title": "治癒水に残る声",
    "description": "治癒水を使うたび、以前ここで助けられた誰かの声が一言だけ混ざる。湊は声を消すか迷い、ひよりは声を記録することも治癒の一部だと言う。",
    "options": [
      {
        "label": "声の共通点を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "水を静かに休ませる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "声を仲間へ伝える",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-072",
    "availableFrom": 10,
    "center": "理玖・みらい",
    "title": "眠らない夢時計",
    "description": "夢の中だけで動く時計が、みらいの見たことのない舞台を指している。理玖は夢の時間を観測し、みらいは舞台の終演時刻を自分で決めようとする。",
    "options": [
      {
        "label": "夢の時刻を記録する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "舞台の幕を開ける",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "時計を止める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-073",
    "availableFrom": 10,
    "center": "大和・つばさ",
    "title": "消えない炎拳の跡",
    "description": "深層校舎の壁に、大和が殴っていないはずの炎拳の跡が残っている。つばさは跡を力の証と見るが、大和は誰かが守ろうとして失敗した跡だと考える。",
    "options": [
      {
        "label": "熱の残り方を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "壁を補強する",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      },
      {
        "label": "跡を消さずに残す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-074",
    "availableFrom": 10,
    "center": "レオン・みらい",
    "title": "無観客の最終公演",
    "description": "深層講堂で、終演を告げる幕が何度も下りる。観客は誰もいないが、レオンの音とみらいの夢だけが次の幕を開け続けている。",
    "options": [
      {
        "label": "幕が下りる回数を数える",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "最後まで演奏する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "幕を固定する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-075",
    "availableFrom": 10,
    "center": "エリオット・朔夜",
    "title": "転校生と敵幹部の記録",
    "description": "深層図書館の記録片に、転校生と敵幹部が同じ日に同じ場所へいた記録がある。エリオットは記録者の視点を疑い、朔夜は自分が消したはずの頁を見つめる。",
    "options": [
      {
        "label": "記録の視点を比較する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "頁を封印する",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "空白のまま保管する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-076",
    "availableFrom": 51,
    "center": "蓮・あかり",
    "title": "51回目の通学路",
    "description": "第50章を越えた朝、蓮が知っている通学路にだけ風が吹かず、あかりの星光が道の先を照らす。標識のない分岐で、蓮は仲間が来るまで進まないと決める。",
    "options": [
      {
        "label": "分岐の風を観測する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`MAGIC_TRACE+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "MAGIC_TRACE+1"
          ]
        }
      },
      {
        "label": "星光を道標にする",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "皆を待つ",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGEM-077",
    "availableFrom": 51,
    "center": "颯真・しずく",
    "title": "章番号のない議会",
    "description": "生徒会議室の時計と議事録から章番号だけが消える。颯真は会議を続ける理由を問い、しずくは番号がなくても決定の順序は残っていると示す。",
    "options": [
      {
        "label": "議事の順序を再構成する",
        "text": "`LEARNING` 成功`DRAW+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "DRAW+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "新しい規則を一つ決める",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "議会を休会する",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-078",
    "availableFrom": 51,
    "center": "湊・ひより",
    "title": "海のない水曜日",
    "description": "水の魔法だけが海の音を記憶しており、学園の廊下に波のない潮騒が響く。湊は音の中の孤独を受け止め、ひよりは水を小さな花の器へ移す。",
    "options": [
      {
        "label": "潮騒の周期を読む",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "水を花へ分ける",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      },
      {
        "label": "音を皆で聞く",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-079",
    "availableFrom": 51,
    "center": "理玖・まどか",
    "title": "時計塔の外側",
    "description": "時計塔の窓の外に、校舎ではなく時計の裏側だけが広がっている。理玖は時間の外側を観測し、まどかは戻るための一秒を自分たちで作る。",
    "options": [
      {
        "label": "外側の周期を測る",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "一秒を保存する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "塔の中へ戻る",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-080",
    "availableFrom": 51,
    "center": "大和・つばさ",
    "title": "明日のない勝負場",
    "description": "訓練場に勝敗だけを記録する魔法のリングが現れ、勝った者の明日を一日奪う。大和は勝負を拒み、つばさはルールそのものを壊せるか試す。",
    "options": [
      {
        "label": "勝敗の条件を解く",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "二人でリングを降りる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "リングを燃やす",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-081",
    "availableFrom": 51,
    "center": "レオン・みらい",
    "title": "夢の観客席からの拍手",
    "description": "夢の劇場で、誰もいない観客席から拍手だけが聞こえる。レオンは拍手に合わせる演奏を拒み、みらいは拍手の主へ、まだ終わっていないと伝える。",
    "options": [
      {
        "label": "拍手の間隔を分析する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "自分たちの曲を演奏する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "客席を照らす",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-082",
    "availableFrom": 51,
    "center": "エリオット・セラ",
    "title": "星界の返送便",
    "description": "星界へ送った手紙が、宛先不明のまま学園へ戻ってくる。エリオットは宛先が場所ではなく選択だと知り、セラは戻ってきた光を仲間の机へ配る。",
    "options": [
      {
        "label": "返送理由を読み解く",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`GOLD+30`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "GOLD+30"
          ]
        }
      },
      {
        "label": "手紙を開かず保管する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "全員で新しい宛先を決める",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-083",
    "availableFrom": 51,
    "center": "朔夜・れい",
    "title": "黒帳の観測窓",
    "description": "黒帳機関の観測窓に、戦闘中の朔夜ではなく、迷って立ち止まる朔夜の姿が映る。れいは記録を破れると言うが、朔夜は迷いも自分の一部だと認める。",
    "options": [
      {
        "label": "観測窓の視点を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "窓を影札で閉じる",
        "text": "`REMOVE_CURSE+1`。",
        "effects": [
          "REMOVE_CURSE+1"
        ]
      },
      {
        "label": "記録を残す",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-084",
    "availableFrom": 51,
    "center": "男子8人",
    "title": "男子寮にない部屋",
    "description": "男子寮の廊下に、8人それぞれの部屋の間に存在しない部屋が一つだけ現れる。扉の前には、全員が選ばなかった道具が一つずつ置かれていた。",
    "options": [
      {
        "label": "8つの道具の関係を整理する",
        "text": "`LEARNING` 成功`CARD+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "CARD+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "一つだけ部屋へ入れる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "全員で扉を閉じる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-085",
    "availableFrom": 51,
    "center": "湊・大和",
    "title": "属性のない魔力試合",
    "description": "訓練場から属性色が消え、湊の水も大和の炎も同じ透明な光になる。二人は属性の強さではなく、相手の動きを信じて試合を続ける。",
    "options": [
      {
        "label": "無属性の動きを観測する",
        "text": "`LEARNING` 成功`UPGRADE+1`／失敗`GOLD+20`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "UPGRADE+1"
          ],
          "failureEffects": [
            "GOLD+20"
          ]
        }
      },
      {
        "label": "互いに防御を任せる",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      },
      {
        "label": "試合をやめる",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGEM-086",
    "availableFrom": 51,
    "center": "理玖・エリオット",
    "title": "記録者の名前の空欄",
    "description": "世界の記録に、記録者の名前だけが空欄になっている。理玖は空欄の前後に残る時刻を、エリオットは星界の表記を照合し、書くべき名前を急いで決めない。",
    "options": [
      {
        "label": "時刻と表記を照合する",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "空欄を保存する",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "仲間の名前を記録する",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-087",
    "availableFrom": 51,
    "center": "レオン・朔夜",
    "title": "真逆の詠唱",
    "description": "レオンの幻術と朔夜の封印が、同じ呪文を逆向きに唱えている。二つを無理に合わせれば強いが、どちらかの記憶が消える可能性がある。",
    "options": [
      {
        "label": "詠唱の対応を解く",
        "text": "`LEARNING` 成功`REMOVE_CURSE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "REMOVE_CURSE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "別々のまま重ねる",
        "text": "`MAGIC_TRACE+1`。",
        "effects": [
          "MAGIC_TRACE+1"
        ]
      },
      {
        "label": "詠唱を止める",
        "text": "`HEAL+8`。",
        "effects": [
          "HEAL+8"
        ]
      }
    ]
  },
  {
    "id": "MGEM-088",
    "availableFrom": 51,
    "center": "男子8人",
    "title": "男子8人の無音結界",
    "description": "男子寮の中央に、音も文字も通さない結界が張られる。蓮は風で気配を伝え、颯真は順番を決め、湊は水面で合図を作り、8人は声なしで役割を分ける。",
    "options": [
      {
        "label": "無音の合図を体系化する",
        "text": "`LEARNING` 成功`TEAM+1`／失敗`RISK:HP-5`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "TEAM+1"
          ],
          "failureEffects": [
            "RISK:HP-5"
          ]
        }
      },
      {
        "label": "8属性の魔法を同時に使う",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "結界が消えるまで待つ",
        "text": "`HEAL+12`。",
        "effects": [
          "HEAL+12"
        ]
      }
    ]
  },
  {
    "id": "MGEM-089",
    "availableFrom": 51,
    "center": "男子8人・ノクスの記録片",
    "title": "男子8人・ノクスの記録片",
    "description": "ノクスの記録片に、男性主人公たちが勝った場面ではなく、互いの失敗を待った場面だけが残されている。理玖は記録の欠落を探し、朔夜は欠落したままの記憶を守ろうとする。",
    "options": [
      {
        "label": "記録の欠落を調べる",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`／失敗`RISK:CORRUPTION+1`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1"
          ],
          "failureEffects": [
            "RISK:CORRUPTION+1"
          ]
        }
      },
      {
        "label": "記録を上書きする",
        "text": "`UPGRADE+1`。",
        "effects": [
          "UPGRADE+1"
        ]
      },
      {
        "label": "全員で記録を分ける",
        "text": "`TEAM+1`。",
        "effects": [
          "TEAM+1"
        ]
      }
    ]
  },
  {
    "id": "MGEM-090",
    "availableFrom": 51,
    "center": "男子8人",
    "title": "男子寮の明日を選ぶ鐘",
    "description": "男子寮の鐘が、過去の始業ではなく、まだ選ばれていない明日を告げる。8人が別々に鳴らせば別の世界が開き、全員で一度だけ鳴らせば同じ朝へ続く道が現れる。",
    "options": [
      {
        "label": "8人で一緒に鳴らす",
        "text": "`LEARNING` 成功`MAGIC_TRACE+1`＋`TEAM+1`／失敗`HEAL+12`。",
        "effects": [],
        "learning": {
          "successEffects": [
            "MAGIC_TRACE+1",
            "TEAM+1"
          ],
          "failureEffects": [
            "HEAL+12"
          ]
        }
      },
      {
        "label": "一人ずつ別の鐘を鳴らす",
        "text": "`CARD+1`。",
        "effects": [
          "CARD+1"
        ]
      },
      {
        "label": "鐘を鳴らさず朝を待つ",
        "text": "`MAX_HP+3`。",
        "effects": [
          "MAX_HP+3"
        ]
      }
    ]
  }
];

