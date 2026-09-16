import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, '_generated');
const SCHOOL_UNIT_MODE = /^(?:(?:MATH|KOKUGO|ENGLISH)_G\d+|(?:SCIENCE|SOCIAL|LIFE)_\d+)_U\d+$/;

const plan = (priority, kinds, reason) => ({ priority, kinds, reason });

const rendererFamilyForKind = (kind) => {
  if (/number_line|ten_frame|place_value|bar_model|array_model|groups_model|measurement|comparison_strip|double_number_line|ratio_bar|motion_strip|percent_bar|redistribution|balance_equation|algebra_tiles|area_model|square_area|unit_cubes|area_grid|shape_decomposition|circle_area|soroban|expression_flow|sign_pattern/.test(kind)) return 'quantity-model';
  if (/bar_chart|line_chart|pie_chart|dot_plot|histogram|box_plot|sample_population|climograph|population_pyramid/.test(kind)) return 'data-chart';
  if (/coordinate_plane|table_graph_link|motion_graph/.test(kind)) return 'coordinate-graph';
  if (/geometry|polygon|angle|circle|transformation_overlay|prism|cylinder|solid_cross_section/.test(kind)) return 'geometry';
  if (/probability_tree|spinner|dice_grid/.test(kind)) return 'probability';
  if (/sentence_blocks|sentence_structure|word_class_blocks|paragraph_structure|idea_hierarchy|writing_structure|argument_map|speech_structure|story_timeline|character_relation|classical_sentence_map|sound_blocks|word_blocks|dictionary_order|reading_order/.test(kind)) return 'language-structure';
  if (/region_map|map_layer|climate_map|production_map|trade_flow_map|route_map|town_map|historical_map|thematic_map|world_map|hazard_map|simple_map/.test(kind)) return 'map';
  if (/timeline|cause_effect_flow|government_flow|institution_relationship|process_flow|infrastructure_flow|supply_chain|network_flow|information_flow|organization_flow|work_flow|money_flow/.test(kind)) return 'flow-diagram';
  if (/electric_circuit|magnetic_field|energy_flow|force_|vector_|lever|ray_diagram|wave_diagram|vibration_model|pressure_area|compression_model/.test(kind)) return 'science-physics';
  if (/particle|beaker|phase_change|heat_flow|combustion|gas_|ph_scale|atom_molecule|balance_model/.test(kind)) return 'science-matter';
  if (/life_cycle|growth_sequence|plant_anatomy|transport_flow|body_system|circulation_flow|cell_diagram|food_web|ecosystem_flow|punnett|chromosome|observation_compare|classification_tree/.test(kind)) return 'science-life';
  if (/orbit|sky_path|moon_phase|weather_map|front_cross_section|river_cross_section|erosion_flow|strata|volcano|seismic|plate_motion/.test(kind)) return 'science-earth';
  if (/tense_timeline|spatial_preposition|comparison_scale|condition_branch|picture_card|category_grid|letter_grid|letter_case_pair|calendar|schedule_timeline|body_label/.test(kind)) return 'english-support';
  return 'specialized';
};

const classifyMath = (title) => {
  if (/算数のまとめ/.test(title)) return plan('C', [], '総合復習は問題内容ごとに既存visualを再利用し、単元専用visualは増やさない。');
  if (/式の計算|文字式の計算|式の展開と因数分解/.test(title)) return plan('B', ['algebra_tiles'], '式変形を面積・タイルで確認する問題に限定して有効。');
  if (/文字式$|文字と式|□をつかった式/.test(title)) return plan('B', ['balance_equation', 'algebra_tiles'], '未知数や文字の意味を数量関係として見せると理解しやすい。');
  if (/平方根/.test(title)) return plan('B', ['number_line', 'square_area'], '数直線上の位置と正方形の面積モデルが概念理解を助ける。');
  if (/二次方程式/.test(title)) return plan('B', ['coordinate_plane', 'area_model'], '解とグラフ・面積モデルを結び付ける問題で有効。');
  if (/大きい数|100までの数|3けたの数|整数と小数/.test(title)) return plan('B', ['place_value_blocks', 'place_value_chart', 'number_line'], '位取りや数の大きさを見せる問題で有効。');
  if (/かずとすうじ|いくつといくつ|20までのかず|なんばんめ/.test(title)) return plan('B', ['ten_frame', 'dots', 'number_line'], '数のまとまり・順序を具体物と数直線で補助する。');
  if (/あわせていくつ|ふえるといくつ|のこりはいくつ|ちがいはいくつ|たし算|ひき算/.test(title)) return plan('A', ['ten_frame', 'place_value_blocks', 'bar_model', 'number_line'], '加減の意味、繰り上がり・繰り下がり、差を視覚化する価値が高い。');
  if (/3つのかずのけいさん|式と計算のじゅんじょ/.test(title)) return plan('B', ['number_line', 'expression_flow'], '計算の順序を段階表示する問題で有効。');
  if (/ぶんしょうだい|一次方程式の利用|連立方程式の利用|二次方程式の利用/.test(title)) return plan('A', ['bar_model', 'relationship_diagram', 'coordinate_plane'], '文章中の数量関係を図に置き換えること自体が学習目標になる。');
  if (/かけ算のいみ|九九|かけ算$/.test(title)) return plan('A', ['array_model', 'groups_model', 'number_line'], '同じ数のまとまり・倍の意味を配列で理解させる。');
  if (/わり算|あまりのあるわり算/.test(title)) return plan('A', ['groups_model', 'array_model', 'bar_model'], '等分除・包含除・あまりを具体的に示せる。');
  if (/小数/.test(title)) return plan('A', ['number_line', 'place_value_chart', 'area_model'], '小数の位置・位取り・演算を数直線と面積で結び付ける。');
  if (/分数/.test(title)) return plan('A', ['fraction_area', 'fraction_number_line', 'fraction_operation'], '分数は面積モデルと数直線の両方で表す価値が高い。');
  if (/長さ|ながさ|重さ|かさ/.test(title)) return plan('A', ['measurement_scale', 'comparison_strip'], '目盛り・単位・量の比較は図を読む技能そのもの。');
  if (/時こく|時間|なんじ/.test(title)) return plan('A', ['clock', 'time_line'], '時計の読みと経過時間は視覚情報が中心。');
  if (/表とグラフ|えぐらふ|ひょう$|折れ線グラフ|表やグラフ|帯グラフ|円グラフ|資料の調べ方|資料の整理|データの分析|標本調査/.test(title)) return plan('A', ['bar_chart', 'line_chart', 'pie_chart', 'dot_plot', 'histogram', 'box_plot', 'sample_population'], '資料を図から読み取ることが単元の中心。');
  if (/平均/.test(title)) return plan('B', ['redistribution_bar', 'bar_chart'], '平均化を高さのならしとして示すと意味理解に有効。');
  if (/単位量|速さ|割合|比と|比とその利用/.test(title)) return plan('A', ['double_number_line', 'ratio_bar', 'motion_strip', 'percent_bar'], '2量の対応関係を図にすると立式根拠が明確になる。');
  if (/比例|反比例|一次関数|関数 y=ax\^2|変わり方/.test(title)) return plan('A', ['coordinate_plane', 'table_graph_link'], '表・式・グラフを対応させることが学習の中核。');
  if (/場合の数|確率/.test(title)) return plan('A', ['probability_tree', 'spinner', 'dice_grid'], '起こりうる場合を漏れなく整理するため図が有効。');
  if (/がい数/.test(title)) return plan('B', ['number_line'], '四捨五入する境界を数直線で示す問題に有効。');
  if (/そろばん/.test(title)) return plan('A', ['soroban'], '珠の位置そのものが学習対象。');
  if (/面せき|円の面積|およその面積/.test(title)) return plan('A', ['area_grid', 'shape_decomposition', 'circle_area'], '分割・移動・方眼による面積理解が必要。');
  if (/体積|角柱と円柱/.test(title)) return plan('A', ['unit_cubes', 'prism', 'cylinder', 'solid_cross_section'], '底面積×高さや立体構成を空間的に示す必要がある。');
  if (/かたち|さんかく|しかく|合同|対称|正多角形|平面図形|空間図形|図形|拡大図|縮図|相似|三平方|円の性質|角$|円と球/.test(title)) return plan('A', ['geometry_diagram', 'polygon', 'angle', 'circle', 'transformation_overlay'], '形・角・対応・補助線など図そのものを読んで考える単元。');
  if (/正の数と負の数|正負の数の加法と減法/.test(title)) return plan('A', ['number_line'], '正負の位置と移動を数直線で捉えることが重要。');
  if (/正負の数の乗法と除法/.test(title)) return plan('B', ['number_line', 'sign_pattern'], '符号規則の確認に補助図が使える。');
  if (/一次方程式$|連立方程式$/.test(title)) return plan('A', ['balance_equation', 'coordinate_plane'], '等式の性質や2式の交点を視覚化できる。');
  return plan('C', [], '通常の式・文章表示で十分。');
};

const classifyScience = (title) => {
  if (/しぜんのかんさつ|生物の観察と分類/.test(title)) return plan('B', ['observation_compare', 'classification_tree'], '観察ポイントや分類条件を整理する問題で有効。');
  if (/こん虫のせい長|しょくぶつのせい長|植物の発芽と成長|花から実へ|メダカのたんじょう|人のたんじょう|生物の成長と生殖/.test(title)) return plan('A', ['life_cycle', 'growth_sequence'], '時間順の変化や成長段階を並べて理解する単元。');
  if (/季節と生き物/.test(title)) return plan('B', ['season_cycle', 'life_cycle'], '季節変化との対応を示す問題で有効。');
  if (/太陽と地面/.test(title)) return plan('A', ['sun_shadow'], '太陽の位置と影の向き・長さの関係が図で明確になる。');
  if (/星と空|月の動き|月と太陽|地球と宇宙|太陽系|星の動き/.test(title)) return plan('A', ['orbit_diagram', 'sky_path', 'moon_phase'], '天体の位置関係と見かけの動きは図なしでは理解しにくい。');
  if (/光/.test(title)) return plan('A', ['ray_diagram'], '反射・屈折・像は光線図を読むことが重要。');
  if (/音/.test(title)) return plan('A', ['wave_diagram', 'vibration_model'], '振動・振幅・周波数を形として比較できる。');
  if (/風とゴム/.test(title)) return plan('B', ['force_arrow', 'distance_comparison'], '力の大きさと動きの変化を比較する問題で有効。');
  if (/電気の通り道|電気のはたらき|電磁石|電気の利用|電流$|電流と磁界/.test(title)) return plan('A', ['electric_circuit', 'magnetic_field', 'energy_flow'], '回路・電流の向き・磁界は模式図が学習の中心。');
  if (/じしゃく/.test(title)) return plan('A', ['magnetic_field', 'magnet_force'], '極と力の向き・磁力線を図示できる。');
  if (/ものの重さ|力と圧力|力の合成と分解/.test(title)) return plan('A', ['force_diagram', 'pressure_area', 'vector_composition'], '力の向きと大きさを矢印で示す必要がある。');
  if (/天気と気温|天気の変化|台風と天気|天気と気象|前線と天気/.test(title)) return plan('A', ['weather_map', 'line_chart', 'front_cross_section'], '気象データ・雲・前線の配置を読み取ることが重要。');
  if (/空気と水|とじこめた空気/.test(title)) return plan('A', ['particle_model', 'compression_model'], '圧縮と体積変化を粒子モデルで説明しやすい。');
  if (/水のすがた|もののあたたまり方/.test(title)) return plan('A', ['phase_change', 'heat_flow'], '状態変化や熱の移動を流れとして見せられる。');
  if (/流れる水のはたらき/.test(title)) return plan('A', ['river_cross_section', 'erosion_flow'], '侵食・運搬・堆積の場所を地形と対応させる。');
  if (/物のとけ方|水溶液の性質|水よう液|酸とアルカリ|中和/.test(title)) return plan('A', ['beaker_model', 'particle_model', 'ph_scale'], '溶解・濃度・酸アルカリを粒子や目盛りで示すと理解しやすい。');
  if (/物の燃え方/.test(title)) return plan('A', ['combustion_model', 'gas_composition'], '燃焼前後の気体の変化と条件を模式化できる。');
  if (/植物のつくりとはたらき/.test(title)) return plan('A', ['plant_anatomy', 'transport_flow'], '根・茎・葉と水や養分の流れを図で関連付ける。');
  if (/人の体のつくりとはたらき|動物の体のつくりとはたらき/.test(title)) return plan('A', ['body_system', 'circulation_flow'], '器官の位置と働きのつながりを図で整理する。');
  if (/てこ/.test(title)) return plan('A', ['lever'], '支点・力点・作用点と距離の関係が図そのもの。');
  if (/土地のつくり|大地の変化|火山|地震|地層/.test(title)) return plan('A', ['strata_cross_section', 'volcano_cross_section', 'seismic_wave', 'plate_motion'], '地下構造や時間変化を断面図で示す必要がある。');
  if (/生き物と環境|生物のつながり/.test(title)) return plan('A', ['food_web', 'ecosystem_flow'], '食物連鎖・物質循環の関係をネットワークで表せる。');
  if (/身のまわりの物質|気体の性質/.test(title)) return plan('B', ['particle_model', 'gas_collection'], '性質比較や気体の集め方を図で確認する問題に有効。');
  if (/生物と細胞/.test(title)) return plan('A', ['cell_diagram'], '細胞の各部位と違いを図から判断する単元。');
  if (/化学変化|原子と分子|化学変化と質量|化学変化とイオン/.test(title)) return plan('A', ['particle_reaction', 'atom_molecule', 'balance_model'], '反応前後の粒子数・結び付き・電荷を視覚化する。');
  if (/遺伝/.test(title)) return plan('A', ['punnett_square', 'chromosome_model'], '遺伝情報の組合せを表で追うことが有効。');
  if (/運動/.test(title)) return plan('A', ['motion_graph', 'motion_strip'], '位置・時間・速さをグラフと連続図で結び付ける。');
  if (/仕事とエネルギー/.test(title)) return plan('A', ['energy_bar', 'force_distance'], 'エネルギー変換や仕事を量の変化として表せる。');
  return plan('B', ['concept_diagram'], '理科は模式図が有効だが、この単元では問題内容を選んで限定的に使う。');
};

const classifySocial = (title) => {
  if (/地図の見かた|地図帳の使い方|都道府県|日本の地形|県のようす|日本の国土|世界の地域|日本の地域|日本の自然|土地のようす/.test(title)) return plan('A', ['region_map', 'map_layer'], '位置・分布・方位を地図から読み取ることが学習の中心。');
  if (/気候|日本の気候|世界の気候/.test(title)) return plan('A', ['climate_map', 'climograph'], '地域分布と気温・降水量を対応させる必要がある。');
  if (/人口/.test(title)) return plan('A', ['population_map', 'population_pyramid', 'bar_chart'], '人口分布や構成を資料から読み取る単元。');
  if (/農業|水産業|工業|世界の産業|日本の産業/.test(title)) return plan('A', ['production_map', 'supply_chain'], '生産地域と流通のつながりを地図・フローで示せる。');
  if (/貿易/.test(title)) return plan('A', ['trade_flow_map', 'bar_chart'], '輸出入の方向・品目・相手国を流れとして示す価値が高い。');
  if (/交通のはたらき/.test(title)) return plan('A', ['route_map', 'transport_flow'], '交通網と人・物の移動を図で考える単元。');
  if (/わたしたちの町|まち|市のようすのうつりかわり/.test(title)) return plan('B', ['town_map', 'timeline'], '地域の位置関係や変化を扱う問題で有効。');
  if (/水のしごと|ごみのしょり/.test(title)) return plan('A', ['process_flow', 'infrastructure_flow'], '施設から家庭までの流れを順序立てて理解する単元。');
  if (/災害とくらし/.test(title)) return plan('A', ['hazard_map', 'evacuation_flow'], '危険箇所・避難経路・災害種別を地図で考えられる。');
  if (/情報産業/.test(title)) return plan('B', ['network_flow', 'information_flow'], '情報が届く経路を可視化する問題で有効。');
  if (/環境問題|食料問題/.test(title)) return plan('B', ['cause_effect_flow', 'supply_chain'], '原因と影響のつながりを整理する問題で有効。');
  if (/古代文明|ギリシャ・ローマ/.test(title)) return plan('A', ['historical_map', 'timeline'], '文明の位置と年代を同時に見る価値が高い。');
  if (/日本の歴史|古墳時代|奈良時代|平安時代|鎌倉時代|室町時代|安土桃山時代|江戸時代|明治時代|大正時代|昭和時代|日本の古代|日本の中世|日本の近世|欧米の近代化|明治維新|日本の近代化|世界大戦|現代の日本/.test(title)) return plan('B', ['timeline', 'cause_effect_flow', 'historical_map'], '年代・因果・勢力範囲を扱う問題に絞って有効。');
  if (/日本国憲法|民主主義|国会|内閣|裁判所|地方自治|選挙/.test(title)) return plan('A', ['government_flow', 'institution_relationship'], '制度間の関係・手続き・三権のつながりを図で整理できる。');
  if (/人権|現代社会|税金|市場経済|金融|労働|社会保障/.test(title)) return plan('B', ['cause_effect_flow', 'money_flow', 'institution_relationship'], '制度やお金の流れを扱う設問で補助図が有効。');
  if (/国際社会|国際協力/.test(title)) return plan('B', ['world_map', 'organization_flow'], '国・地域・国際機関の関係を扱う問題で有効。');
  if (/アジア|ヨーロッパ|アフリカ|北アメリカ|南アメリカ|オセアニア/.test(title)) return plan('A', ['region_map', 'thematic_map'], '地域ごとの位置・自然・産業の分布を地図で扱う。');
  if (/伝統文化/.test(title)) return plan('B', ['region_map', 'timeline'], '地域や時代との対応を示す問題で有効。');
  if (/町ではたらく人|商店のしごと|農家のしごと|工場のしごと/.test(title)) return plan('B', ['work_flow', 'supply_chain'], '仕事の工程や人のつながりを順序で示す問題に有効。');
  return plan('C', [], '知識・文章中心で、動的図を標準化する効果が小さい。');
};

const classifyKokugo = (title) => {
  if (/主語と述語|文のきまり|文の成分|文法/.test(title)) return plan('A', ['sentence_structure'], '文の要素を色分け・ブロック化して関係を示す価値が高い。');
  if (/品詞/.test(title)) return plan('A', ['word_class_blocks', 'sentence_structure'], '語の役割を分類し、文中の位置と対応させられる。');
  if (/段落と要旨|まとまり|要約|要旨/.test(title)) return plan('A', ['paragraph_structure', 'idea_hierarchy'], '段落関係・中心文・要旨の構造を可視化できる。');
  if (/説明文の読み|せつめい文|説明文/.test(title)) return plan('B', ['paragraph_structure', 'cause_effect_flow'], '文章構造や因果関係を問う問題で有効。');
  if (/物語文|おはなし|ばめん/.test(title)) return plan('B', ['story_timeline', 'character_relation'], '場面の順序や人物関係を問う問題に限定して有効。');
  if (/日記|作文|手紙|意見文|報告文|提案文|論説文/.test(title)) return plan('B', ['writing_structure'], '文章の組み立てを作る問題で構成図が使える。');
  if (/国語じてん|国語辞典|漢字辞典/.test(title)) return plan('B', ['dictionary_order'], '見出し語の順序や辞書の構成を扱う問題で有効。');
  if (/古典|古文|漢文/.test(title)) return plan('B', ['reading_order', 'classical_sentence_map'], '返り点・語順・現代語との対応を扱う問題で使える。');
  if (/話し合い|討論|発表|スピーチ/.test(title)) return plan('B', ['argument_map', 'speech_structure'], '意見と理由、発表構成を整理する問題に有効。');
  if (/のばすおん|ちいさい「っ」|は・を・へ/.test(title)) return plan('B', ['sound_blocks', 'word_blocks'], '音や助詞の位置をブロックで示す問題に有効。');
  return plan('C', [], '文字・文章そのものを読むことを優先し、図が答えの手掛かりになり過ぎないようにする。');
};

const classifyEnglish = (title) => {
  if (/リスニング|発声|復唱|まねして言う|声に出す|応答問題|こたえる問題|スピーチ|長文読解|英作文/.test(title)) return plan('C', [], '音声・発話・本文を主役にし、動的visualは原則使わない。');
  if (/be動詞|一般動詞|疑問文|否定文|命令文|can|三人称単数|複数形|代名詞|助動詞|不定詞|動名詞|接続詞|受動態|関係代名詞|間接疑問文|分詞/.test(title)) return plan('A', ['sentence_blocks'], '語順や文の役割をブロックで動かして示すと理解しやすい。');
  if (/現在進行形|過去形|過去進行形|未来表現|現在完了|現在完了進行形/.test(title)) return plan('A', ['sentence_blocks', 'tense_timeline'], '語順に加えて時間軸を示すことが文法理解に有効。');
  if (/^(場所|学校の中)$/.test(title)) return plan('B', ['picture_card'], '実データは場所を表す語彙問題が中心。静止絵カードは有効だが、動的Canvasを標準化する必要性は低い。');
  if (/前置詞/.test(title)) return plan('A', ['spatial_preposition'], 'in/on/under等の位置関係は図を見る問題と相性がよい。');
  if (/比較/.test(title)) return plan('A', ['comparison_scale', 'sentence_blocks'], '2者・3者の比較関係を視覚的に整理できる。');
  if (/仮定法/.test(title)) return plan('A', ['condition_branch', 'tense_timeline'], '現実と仮定の分岐を図で示すと理解しやすい。');
  if (/時こく|一日の生活|曜日|誕生日/.test(title)) return plan('B', ['clock', 'schedule_timeline', 'calendar'], '時刻・曜日・日付を扱う設問に限定して有効。');
  if (/からだのぶぶん/.test(title)) return plan('B', ['body_label'], '部位と英単語を対応させる問題で有効。');
  if (/かず|いろ|どうぶつ|くだもの|たべもの|文ぼうぐ|家族|かぞく|天気|教科|行きたい場所/.test(title)) return plan('B', ['picture_card', 'category_grid'], '語彙の意味確認に視覚支援は有効だが、動的生成は限定的でよい。');
  if (/アルファベット/.test(title)) return plan('B', ['letter_grid', 'letter_case_pair'], '大文字小文字・並び順を扱う問題に有効。');
  return plan('C', [], '会話・語彙・表現そのものを中心にし、必要なら静止イラストを使う。');
};

const classifyLife = (title) => {
  if (/はなややさい|やさいをそだてよう/.test(title)) return plan('A', ['growth_sequence', 'plant_life_cycle'], '成長の順序と変化を観察する単元なので連続図が有効。');
  if (/きせつ/.test(title)) return plan('B', ['season_cycle'], '季節ごとの自然や生き物の違いを比較する問題で有効。');
  if (/いきもの/.test(title)) return plan('B', ['observation_compare', 'life_cycle'], '観察ポイントや変化を比べる問題で有効。');
  if (/がっこうたんけん|まちたんけん/.test(title)) return plan('B', ['simple_map', 'route_map'], '場所や順路を扱う問題に限定して地図表現が使える。');
  if (/おもちゃづくり|みぢかなものあそび/.test(title)) return plan('B', ['process_sequence', 'mechanism_diagram'], '作り方や仕組みを順序立てる問題で有効。');
  if (/じぶんのせいちょう/.test(title)) return plan('B', ['growth_timeline'], '過去と現在の変化を時系列で示す問題に有効。');
  return plan('C', [], '体験・対話を中心にし、動的visualは原則不要。');
};

const classify = (mode, title) => {
  if (mode.startsWith('MATH_')) return classifyMath(title);
  if (mode.startsWith('SCIENCE_')) return classifyScience(title);
  if (mode.startsWith('SOCIAL_')) return classifySocial(title);
  if (mode.startsWith('KOKUGO_')) return classifyKokugo(title);
  if (mode.startsWith('ENGLISH_')) return classifyEnglish(title);
  if (mode.startsWith('LIFE_')) return classifyLife(title);
  return plan('C', [], '対象外。');
};

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });

try {
  const { SUBJECT_DATA } = await server.ssrLoadModule('/src/data/subjectData.ts');
  const { getUnitBoardSummary } = await server.ssrLoadModule('/src/data/unitBoardSummaries.ts');
  const rows = Object.entries(SUBJECT_DATA)
    .filter(([mode]) => SCHOOL_UNIT_MODE.test(mode))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([mode, problems]) => {
      const summary = getUnitBoardSummary(mode);
      const title = summary?.title || '';
      const visualProblems = problems.filter((problem) => problem.visual);
      const currentKinds = [...new Set(visualProblems.map((problem) => problem.visual.kind))].sort();
      const recommendation = classify(mode, title);
      const rendererFamilies = [...new Set(recommendation.kinds.map(rendererFamilyForKind))].sort();
      return {
        mode,
        grade: summary?.grade ?? null,
        title,
        subject: mode.split('_')[0],
        priority: recommendation.priority,
        recommendedKinds: recommendation.kinds,
        rendererFamilies,
        reason: recommendation.reason,
        problemCount: problems.length,
        visualProblemCount: visualProblems.length,
        currentKinds,
        needsNewVisual: recommendation.priority === 'A' && visualProblems.length === 0,
        needsDisplayUpgrade: visualProblems.length > 0,
      };
    });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'dynamic-visual-unit-plan.json'), `${JSON.stringify(rows, null, 2)}\n`);

  const tsvHeader = [
    'mode', 'grade', 'subject', 'title', 'priority', 'problemCount', 'visualProblemCount',
    'currentKinds', 'recommendedKinds', 'rendererFamilies', 'needsNewVisual', 'needsDisplayUpgrade', 'reason',
  ];
  const escapeTsv = (value) => String(value ?? '').replace(/[\t\r\n]+/g, ' ');
  const tsv = [
    tsvHeader.join('\t'),
    ...rows.map((row) => [
      row.mode,
      row.grade,
      row.subject,
      row.title,
      row.priority,
      row.problemCount,
      row.visualProblemCount,
      row.currentKinds.join(','),
      row.recommendedKinds.join(','),
      row.rendererFamilies.join(','),
      row.needsNewVisual ? 'YES' : '',
      row.needsDisplayUpgrade ? 'YES' : '',
      row.reason,
    ].map(escapeTsv).join('\t')),
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'dynamic-visual-unit-plan.tsv'), `${tsv}\n`);

  const subjects = ['MATH', 'SCIENCE', 'SOCIAL', 'KOKUGO', 'ENGLISH', 'LIFE'];
  const priorityCounts = Object.fromEntries(subjects.map((subject) => {
    const subjectRows = rows.filter((row) => row.subject === subject);
    return [subject, {
      A: subjectRows.filter((row) => row.priority === 'A').length,
      B: subjectRows.filter((row) => row.priority === 'B').length,
      C: subjectRows.filter((row) => row.priority === 'C').length,
      existingVisualUnits: subjectRows.filter((row) => row.visualProblemCount > 0).length,
      newVisualAUnits: subjectRows.filter((row) => row.needsNewVisual).length,
    }];
  }));
  const total = {
    A: rows.filter((row) => row.priority === 'A').length,
    B: rows.filter((row) => row.priority === 'B').length,
    C: rows.filter((row) => row.priority === 'C').length,
    existingVisualUnits: rows.filter((row) => row.visualProblemCount > 0).length,
    newVisualAUnits: rows.filter((row) => row.needsNewVisual).length,
  };

  const kindCounts = new Map();
  const familyCounts = new Map();
  rows.filter((row) => row.priority === 'A').forEach((row) => {
    row.recommendedKinds.forEach((kind) => kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1));
    row.rendererFamilies.forEach((family) => familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1));
  });
  const topKinds = [...kindCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const topFamilies = [...familyCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  console.log(`DYNAMIC_VISUAL_UNITS ${rows.length}`);
  console.log(`DYNAMIC_VISUAL_PRIORITY ${JSON.stringify(total)}`);
  console.log(`DYNAMIC_VISUAL_BY_SUBJECT ${JSON.stringify(priorityCounts)}`);
  console.log(`DYNAMIC_VISUAL_RENDERER_FAMILIES ${JSON.stringify(topFamilies)}`);
  console.log(`DYNAMIC_VISUAL_TOP_KINDS ${JSON.stringify(topKinds.slice(0, 30))}`);
  console.log('DYNAMIC_VISUAL_A_GAPS');
  rows.filter((row) => row.needsNewVisual).forEach((row) => {
    console.log(`${row.mode}\t${row.title}\t${row.recommendedKinds.join(',')}`);
  });
} finally {
  await server.close();
}
