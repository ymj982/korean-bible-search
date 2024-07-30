import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal } from 'obsidian';
const request = require('request');

// Remember to rename these classes and interfaces!

interface KoreanBibleSearchPluginSettings {
	mySetting: string;
}

interface SuggestionDetails {
	chapter: string;
	verses: string;
	book: string;
  }

const DEFAULT_SETTINGS: KoreanBibleSearchPluginSettings = {
	mySetting: 'default'
}

export default class KoreanBibleSearchPlugin extends Plugin {
	settings: KoreanBibleSearchPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('quote', 'Search Bible', (evt: MouseEvent) => {
			new VerseSuggestModal(this.app).open();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new VerseSuggestModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

const bookNames = {
	"1": {
		name: "Genesis",
		key: "ge",
		koreanNames: [
			"창세기",
			"창"
		],
		shortNames: [
			"Ge",
			"Gen"
		  ],
	},
	"2": {
		name: "Exodus",
		key: "exo",
		koreanNames: [
			"출애굽기",
			"출"
		],
		shortNames: [
			"Ex",
			"Exo"
		  ],
	},
	"3": {
		name: "Leviticus",
		key: "lev",
		koreanNames: [
			"레위기",
			"레"
		],
		shortNames: [
			"Le",
			"Lev"
		  ],
	},
	"4": {
		name: "Numbers",
		key: "num",
		koreanNames: [
			"민수기",
			"민"
		],
		shortNames: [
			"Nu",
			"Num"
		  ],
	},
	"5": {
		name: "Deuteronomy",
		key: "deu",
		koreanNames: [
			"신명기",
			"신"
		],
		shortNames: [
			"Dt",
			"Deut",
			"Deu",
			"De"
		  ],
	},
	"6": {
		name: "Joshua",
		key: "josh",
		koreanNames: [
			"여호수아",
			"수"
		],
		shortNames: [
			"Js",
			"Jos",
			"Josh"
		  ],
	},
	"7": {
		name: "Judges",
		key: "jdgs",
		koreanNames: [
			"사사기",
			"삿"
		],
		shortNames: [
			"Jg",
			"Jud",
			"Jdg",
			"Ju",
			"Jdgs",
			"Judg"
		  ],
	},
	"8": {
		name: "Ruth",
		key: "ruth",
		koreanNames: [
			"룻기",
			"룻"
		],
		shortNames: [
			"Ru",
			"Rut"
		  ],
	},
	"9": {
		name: "1 Samuel",
		key: "1sm",
		koreanNames: [
			"사무엘상",
			"삼상"
		],
		shortNames: [
			"1 Sa",
			"1 Sam"
		  ],
	},
	"10": {
		name: "2 Samuel",
		key: "2sm",
		koreanNames: [
			"사무엘하",
			"삼하"
		],
		shortNames: [
			"2 Sa",
			"2 Sam"
		  ],
	},

	"11": {
		name: "1 Kings",
		key: "1ki",
		koreanNames: [
			"열왕기상",
			"왕상"
		],
		shortNames: [
			"1 Ki",
			"1 King",
			"1 Kin",
			"1 Kngs"
		  ],
	},
	"12": {
		name: "2 Kings",
		key: "2ki",
		koreanNames: [
			"열왕기하",
			"왕하"
		],
		shortNames: [
			"2 Ki",
			"2 King",
			"2 Kin",
			"2 Kngs"
		  ],
	},
	"13": {
		name: "1 Chronicles",
		key: "1chr",
		koreanNames: [
			"역대상",
			"대상"
		],
		shortNames: [
			"1 Ch",
			"1 Chr",
			"1 Chron"
		  ],
	},
	"14": {
		name: "2 Chronicles",
		key: "2chr",
		koreanNames: [
			"역대하",
			"대하"
		],
		shortNames: [
			"2 Ch",
			"2 Chr",
			"2 Chron"
		  ],
	},
	"15": {
		name: "Ezra",
		key: "ezra",
		koreanNames: [
			"에스라",
			"스"
		],
		shortNames: [
			"Ez",
			"Ezr"
		  ],
	},
	"16": {
		name: "Nehemiah",
		key: "neh",
		koreanNames: [
			"느헤미야",
			"느"
		],
		shortNames: [
			"Ne",
			"Neh"
		  ],
	},
	"17": {
		name: "Esther",
		key: "est",
		koreanNames: [
			"에스더",
			"에"
		],
		shortNames: [
			"Es",
			"Est",
			"Esth",
			"Ester"
		  ],
	},
	"18": {
		name: "Job",
		key: "job",
		koreanNames: [
			"욥기",
			"욥"
		],
		shortNames: [
			"Jb"
		  ],
	},
	"19": {
		name: "Psalms",
		key: "psa",
		koreanNames: [
			"시편",
			"시"
		],
		shortNames: [
			"Ps",
			"Psa",
			"Pss",
			"Psalms"
		  ],
	},
	"20": {
		name: "Proverbs",
		key: "prv",
		koreanNames: [
			"잠언",
			"잠"
		],
		shortNames: [
			"Pr",
			"Prov",
			"Pro"
		  ],
	},

	"21": {
		name: "Ecclesiastes",
		key: "eccl",
		koreanNames: [
			"전도서",
			"전"
		],
		shortNames: [
			"Ec",
			"Ecc"
		  ],
	},
	"22": {
		name: "Song of Solomon",
		key: "ssol",
		koreanNames: [
			"아가",
			"아"
		],
		shortNames: [
			"SOS",
			"Song of Songs",
			"SongOfSongs"
		  ],
	},
	"23": {
		name: "Isaiah",
		key: "isa",
		koreanNames: [
			"이사야",
			"사"
		],
		shortNames: [
			"Isa"
		  ],
	},
	"24": {
		name: "Jeremiah",
		key: "jer",
		koreanNames: [
			"예레미야",
			"렘"
		],
		shortNames: [
			"Je",
			"Jer"
		  ],
	},
	"25": {
		name: "Lamentations",
		key: "lam",
		koreanNames: [
			"예래미야애가",
			"애가",
			"애"
		],
		shortNames: [
			"La",
			"Lam",
			"Lament"
		  ],
	},
	"26": {
		name: "Ezekiel",
		key: "eze",
		koreanNames: [
			"에스겔",
			"겔"
		],
		shortNames: [
			"Ek",
			"Ezek",
			"Eze"
		  ],
	},
	"27": {
		name: "Daniel",
		key: "dan",
		koreanNames: [
			"다니엘",
			"단"
		],
		shortNames: [
			"Da",
			"Dan",
			"Dl",
			"Dnl"
		  ],
	},
	"28": {
		name: "Hosea",
		key: "hos",
		koreanNames: [
			"호세아",
			"호"
		],
		shortNames: [
			"Ho",
			"Hos"
		  ],
	},
	"29": {
		name: "Joel",
		key: "joel",
		koreanNames: [
			"요엘",
			"욜"
		],
		shortNames: [
			"Jl",
			"Joe"
		  ],
	},
	"30": {
		name: "Amos",
		key: "amos",
		koreanNames: [
			"아모스",
			"암"
		],
		shortNames: [
			"Am",
			"Amo"
		  ],
	},

	"31": {
		name: "Obadiah",
		key: "obad",
		koreanNames: [
			"오바댜",
			"옵"
		],
		shortNames: [
			"Ob",
			"Oba",
			"Obd",
			"Odbh"
		  ],
	},
	"32": {
		name: "Jonah",
		key: "jonah",
		koreanNames: [
			"요나",
			"욘"
		],
		shortNames: [
			"Jh",
			"Jon",
			"Jnh"
		  ],
	},
	"33": {
		name: "Micah",
		key: "mic",
		koreanNames: [
			"미가",
			"미"
		],
		shortNames: [
			"Mi",
			"Mic"
		  ],
	},
	"34": {
		name: "Nahum",
		key: "nahum",
		koreanNames: [
			"나훔",
			"나"
		],
		shortNames: [
			"Na",
			"Nah"
		  ],
	},
	"35": {
		name: "Habakkuk",
		key: "hab",
		koreanNames: [
			"하박국",
			"합"
		],
		shortNames: [
			"Hb",
			"Hab",
			"Hk",
			"Habk"
		  ],
	},
	"36": {
		name: "Zephaniah",
		key: "zep",
		koreanNames: [
			"스바냐",
			"습"
		],
		shortNames: [
			"Zp",
			"Zep",
			"Zeph",
			"Ze"
		  ],
	},
	"37": {
		name: "Haggai",
		key: "hag",
		koreanNames: [
			"학개",
			"학"
		],
		shortNames: [
			"Ha",
			"Hag",
			"Hagg"
		  ],
	},
	"38": {
		name: "Zechariah",
		key: "zep",
		koreanNames: [
			"스가랴",
			"슥"
		],
		shortNames: [
			"Zc",
			"Zech",
			"Zec"
		  ],
	},
	"39": {
		name: "Malachi",
		key: "mal",
		koreanNames: [
			"말라기",
			"말"
		],
		shortNames: [
			"Ml",
			"Mal",
			"Mlc"
		  ],
	},
	"40": {
		name: "Matthew",
		key: "mat",
		koreanNames: [
			"마태복음",
			"마"
		],
		shortNames: [
			"Mt",
			"Matt",
			"Mat"
		  ],
	},

	"41": {
		name: "Mark",
		key: "mark",
		koreanNames: [
			"마가복음",
			"막"
		],
		shortNames: [
			"Mk",
			"Mrk"
		  ],
	},
	"42": {
		name: "Luke",
		key: "luke",
		koreanNames: [
			"누가복음",
			"눅"
		],
		shortNames: [
			"Lk",
			"Luk",
			"Lu"
		  ],
	},
	"43": {
		name: "John",
		key: "john",
		koreanNames: [
			"요한복음",
			"요"
		],
		shortNames: [
			"Jn",
			"Joh",
			"Jo"
		  ],
	},
	"44": {
		name: "Acts",
		key: "acts",
		koreanNames: [
			"사도행전",
			"행"
		],
		shortNames: [
			"Ac",
			"Act"
		  ],
	},
	"45": {
		name: "Romans",
		key: "rom",
		koreanNames: [
			"로마서",
			"롬"
		],
		shortNames: [
			"Ro",
			"Rom",
			"Rmn",
			"Rmns"
		  ],
	},
	"46": {
		name: "1 Corinthians",
		key: "1cor",
		koreanNames: [
			"고린도전서",
			"고전"
		],
		shortNames: [
			"1 Co",
			"1 Cor"
		  ],
	},
	"47": {
		name: "2 Corinthians",
		key: "2cor",
		koreanNames: [
			"고린도후서",
			"고후"
		],
		shortNames: [
			"2 Co",
			"2 Cor"
		  ],
	},
	"48": {
		name: "Galatians",
		key: "gal",
		koreanNames: [
			"갈라디아서",
			"갈"
		],
		shortNames: [
			"Ga",
			"Gal",
			"Gltns"
		  ],
	},
	"49": {
		name: "Ephesians",
		key: "eph",
		koreanNames: [
			"에베소서",
			"엡"
		],
		shortNames: [
			"Ep",
			"Eph",
			"Ephn"
		  ],
	},
	"50": {
		name: "Philippians",
		key: "phi",
		koreanNames: [
			"빌립보서",
			"빌"
		],
		shortNames: [
			"Phi",
			"Phil"
		  ],
	},

	"51": {
		name: "Colossians",
		key: "col",
		koreanNames: [
			"골로새서",
			"골"
		],
		shortNames: [
			"Co",
			"Col",
			"Colo",
			"Cln",
			"Clns"
		  ],
	},
	"52": {
		name: "1 Thessalonians",
		key: "1th",
		koreanNames: [
			"데살로니가전서",
			"살전"
		],
		shortNames: [
			"1 Th",
			"1 Thess",
			"1 Thes"
		  ],
	},
	"53": {
		name: "2 Thessalonians",
		key: "2th",
		koreanNames: [
			"데살로니가후서",
			"살후"
		],
		shortNames: [
			"2 Th",
			"2 Thess",
			"2 Thes"
		  ],
	},
	"54": {
		name: "1 Timothy",
		key: "1tim",
		koreanNames: [
			"디모데전서",
			"딤전"
		],
		shortNames: [
			"1 Ti",
			"1 Tim"
		  ],
	},
	"55": {
		name: "2 Timothy",
		key: "2tim",
		koreanNames: [
			"디모데후서",
			"딤후"
		],
		shortNames: [
			"2 Ti",
			"2 Tim"
		  ],
	},
	"56": {
		name: "Titus",
		key: "titus",
		koreanNames: [
			"디도서",
			"딛"
		],
		shortNames: [
			"Ti",
			"Tit",
			"Tt",
			"Ts"
		  ],
	},
	"57": {
		name: "Philemon",
		key: "phmn",
		koreanNames: [
			"빌레몬서",
			"빌레몬",
			"몬"
		],
		shortNames: [
			"Pm",
			"Phile",
			"Philm"
		  ],
	},
	"58": {
		name: "Hebrews",
		key: "heb",
		koreanNames: [
			"히브리서",
			"히"
		],
		shortNames: [
			"He",
			"Heb",
			"Hw"
		  ],
	},
	"59": {
		name: "James",
		key: "jas",
		koreanNames: [
			"야고보서",
			"약"
		],
		shortNames: [
			"Jm",
			"Jam",
			"Jas",
			"Ja"
		  ],
	},
	"60": {
		name: "1 Peter",
		key: "1pet",
		koreanNames: [
			"베드로전서",
			"벧전"
		],
		shortNames: [
			"1 Pe",
			"1 Pet",
			"1 P"
		  ],
	},
	"61": {
		name: "2 Peter",
		key: "2pet",
		koreanNames: [
			"베드로전서",
			"벧후"
		],
		shortNames: [
			"2 Pe",
			"2 Pet",
			"2 P"
		  ],
	},
	"62": {
		name: "1 John",
		key: "1jn",
		koreanNames: [
			"요한1서",
			"요한일서",
			"요1"
		],
		shortNames: [
			"1 Joh",
			"1 Jo",
			"1 Jn",
			"1 J"
		  ],
	},
	"63": {
		name: "2 John",
		key: "2jn",
		koreanNames: [
			"요한2서",
			"요한이서",
			"요2"
		],
		shortNames: [
			"2 Joh",
			"2 Jo",
			"2 Jn",
			"2 J"
		  ],
	},
	"64": {
		name: "3 John",
		key: "3jn",
		koreanNames: [
			"요한3서",
			"요한3서",
			"요3"
		],
		shortNames: [
			"3 Joh",
			"3 Jo",
			"3 Jn",
			"3 J"
		  ],
	},
	"65": {
		name: "Jude",
		key: "jude",
		koreanNames: [
			"유다서",
			"유"
		],
		shortNames: [],
	},
	"66": {
		name: "Revelation",
		key: "rev",
		koreanNames: [
			"요한계시록",
			"계"
		],
		shortNames: [
			"Re",
			"Rev",
			"Rvltn"
		  ],
	},
	
	/*
   <option>ge (Genesis)</option>
   <option>exo (Exodus)</option>
   <option>lev (Leviticus)</option>
   <option>num (Numbers)</option>
   <option>deu (Deuteronomy)</option>
   <option>josh (Joshua)</option>
   <option>jdgs (Judges)</option>
   <option>ruth (Ruth)</option>
   <option>1sm (1 Samuel)</option>
   <option>2sm (2 Samuel)</option>
   <option>1ki (1 Kings)</option>
   <option>2ki (2 Kings)</option>
   <option>1chr (1 Chronicles)</option>
   <option>2chr (2 Chronicles)</option>
   <option>ezra (Ezra)</option>
   <option>neh (Nehemiah)</option>
   <option>est (Esther)</option>
   <option>job (Job)</option>
   <option>psa (Psalms)</option>
   <option>prv (Proverbs)</option>
   <option>eccl (Ecclesiastes)</option>
   <option>ssol (Songs)</option>
   <option>isa (Isaiah)</option>
   <option>jer (Jeremiah)</option>
   <option>lam (Lamentations)</option>
   <option>eze (Ezekiel)</option>
   <option>dan (Daniel)</option>
   <option>hos (Hosea)</option>
   <option>joel (Joel)</option>
   <option>amos (Amos)</option>
   <option>obad (Obadiah)</option>
   <option>jonah (Jonah)</option>
   <option>mic (Micah)</option>
   <option>nahum (Nahum)</option>
   <option>hab (Habakkuk)</option>
   <option>zep (Zephaniah)</option>
   <option>hag (Haggai)</option>
   <option>zep (Zechariah)</option>
   <option>mal (Malachi)</option>
   <option>mat (Matthew)</option>
   <option>mark (Mark)</option>
   <option>luke (Luke)</option>
   <option>john (John)</option>
   <option>acts (Acts)</option>
   <option>rom (Romans)</option>
   <option>1cor (1 Corinthians)</option>
   <option>2cor (2 Corinthians)</option>
   <option>gal (Galatians)</option>
   <option>eph (Ephesians)</option>
   <option>phi (Philippians)</option>
   <option>col (Colossians)</option>
   <option>1th (1 Thessalonians)</option>
   <option>2th (2 Thessalonians)</option>
   <option>1tim (1 Timothy)</option>
   <option>2tim (2 Timothy)</option>
   <option>titus (Titus)</option>
   <option>phmn (Philemon)</option>
   <option>heb (Hebrews)</option>
   <option>jas (James)</option>
   <option>1pet (1 Peter)</option>
   <option>2pet (2 Peter)</option>
   <option>1jn (1 John)</option>
   <option>2jn (2 John)</option>
   <option>3jn (3 John)</option>
   <option>jude (Jude)</option>
   <option>rev (Revelation)</option>
  */
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		this.setContent("This is sample")
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

function requestPromise(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
	  request(url, (error: any, response: any, body: any) => {
		if (error) {
		  reject(error);
		} else {
		  resolve(body);
		}
	  });
	});
  }

var MODAL_REG = /([123])*\s*[A-z]{2,}\s*\d{1,3}:\d{1,3}(-\d{1,3})*/;
var KOR_MODAL_REG =  /([\uAC00-\uD7AF]{1,})\s*(\d{1,3}):(\d{1,3}(-\d{1,3})?)/;
var BOOK_REG = /[123]*\s*[A-z]{2,}/;
var DEFAULT_TRIGGER_PREFIX_REG = /--|(\+\+)/;

var verseMatch = (verseTrigger: string) => {
	const cleanedQuery = verseTrigger.replace(/\s+/g, '');
	const matchResults = cleanedQuery.match(KOR_MODAL_REG);
	if (!matchResults) {
	  return "";
	} else {
	  return matchResults;
	}
  };

class VerseSuggestModal extends SuggestModal<string> {
	private selectedVerses: string | null = null;
	constructor(app: App) {
		super(app);
		this.setInstructions([
			{ command: "", purpose: "Select verses to insert, ex: 요한복음3:16-18" }
		]);
	}
	onOpen() {
		super.onOpen();
	}
	// Return all available suggestions
	async getSuggestions(query: string): Promise<string[]> {
		const match = verseMatch(query);
		if (match) {
			console.log("trigger on", match);
			const book = match[1];          // Book name
			const chapter = match[2];       // Chapter number
			const verses = match[3];        // Verse(s)
			const bookNameQuery = Object.values(bookNames).find(bookName => bookName.koreanNames.includes(book));
			console.log("BOOK NAME FOUND?", bookNameQuery)
			// return getSuggestionsFromQuery(`${query}`);
			const queryString = `${bookNameQuery?.key}/${chapter}:${verses}`
			const suggestions = await this.callAPI(queryString);
			this.selectedVerses = `${bookNameQuery?.koreanNames[0]} ${chapter}:${verses}`;
			return suggestions;
		}
		return [];
	}

	// Render each suggestion item
		renderSuggestion(suggestion: string, el: HTMLElement) {
		el.createEl('div', { text: suggestion });
	}

	// Perform action on the selected suggestion
	onChooseSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent) {
		// new Notice(`You selected: ${suggestion}`);
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) {
			return;
		}
		
		const formattedSuggestion = this.formatVersesForCallout(suggestion);

		const cursor = editor.getCursor();
		editor.replaceRange(formattedSuggestion, cursor);

		// Calculate the new cursor position
		const newCursorPosition = {
			line: cursor.line + formattedSuggestion.split('\n').length - 1,
			ch: formattedSuggestion.split('\n').pop()?.length || 0
		};

  		editor.setCursor(newCursorPosition);
	}

	formatVersesForCallout(suggestion: string): string {
		const selectedVerses = this.selectedVerses ? this.selectedVerses : "";
		return `> [!quote]+ ${selectedVerses} \n> ${suggestion}`;
	  }

	async callAPI(query: string): Promise<string[]> {
		try {
		  const apiUrl = `http://ibibles.net/quote.php?kor-${query}`;
		  const response = await requestPromise(apiUrl);
		  console.log("Query?", query);
		  console.log("Response?", response);
		  const extractedVerses = extractVerses(response);
  		  console.log(extractedVerses);
		  
	
		  // Assuming the response is a plain text that you can split into suggestions
		  return [formatVerses(extractedVerses)]; // Adjust according to the actual response format
		} catch (error) {
		  console.error('Error fetching data:', error);
		  return [];
		}
	  }
}

interface Verse {
	verseNumber: string;
	verseText: string;
  }

// Function to extract verses and texts
function extractVerses(html: string): Verse[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const smallTags = doc.querySelectorAll('small');
	const verses: { verseNumber: string, verseText: string }[] = [];
  
	smallTags.forEach((smallTag) => {
	  const verseNumber = smallTag.textContent!.trim(); // Non-null assertion
	  let textNode = smallTag.nextSibling;
	  let verseText = '';
  
	  // Traverse until the next <br> or end of node
	  while (textNode && textNode.nodeName !== 'BR') {
		if (textNode.nodeType === Node.TEXT_NODE) {
			verseText += textNode.textContent!.trim(); // Non-null assertion
		}
		textNode = textNode.nextSibling;
	  }
  
	  verses.push({ verseNumber, verseText });
	});
  
	return verses;
  }

  function formatVerses(verses: Verse[]): string {
	return verses.map(v => {
	  const verseNumber = v.verseNumber.split(':')[1]; // Extract the verse number after ':'
	  return `${verseNumber} ${v.verseText}`; // Combine the verse number and text
	}).join('\n'); // Join all strings with a newline character
  }

class SampleSettingTab extends PluginSettingTab {
	plugin: KoreanBibleSearchPlugin;

	constructor(app: App, plugin: KoreanBibleSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
