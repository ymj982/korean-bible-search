import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, SuggestModal, EditorSuggest, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
const request = require('request');

// Interface for plugin settings
interface KoreanBibleSearchPluginSettings {
	mySetting: string;
}

// Default settings
const DEFAULT_SETTINGS: KoreanBibleSearchPluginSettings = {
	mySetting: 'default'
}

// Main plugin class
export default class KoreanBibleSearchPlugin extends Plugin {
	settings: KoreanBibleSearchPluginSettings;

	async onload() {
		await this.loadSettings();

		// Add a ribbon icon
		const ribbonIconEl = this.addRibbonIcon('quote', 'Search Bible', (evt: MouseEvent) => {
			new VerseSuggestModal(this.app).open();
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Add a status bar item
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// Add a simple command
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new VerseSuggestModal(this.app).open();
			}
		});

		// Add a settings tab
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Register the editor suggestion
		this.registerEditorSuggest(new VerseEditorSuggester(this, this.settings));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Book Names
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
}

// Utility functions
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

function verseMatch(verseTrigger: string) {
	const cleanedQuery = verseTrigger.replace(/\s+/g, '');
	return cleanedQuery.match(/([\uAC00-\uD7AF]{1,})\s*(\d{1,3}):(\d{1,3}(-\d{1,3})?)/);
}

interface Verse {
	verseNumber: string;
	verseText: string;
}

function extractVerses(html: string): Verse[] {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const smallTags = doc.querySelectorAll('small');
	const verses: Verse[] = [];

	smallTags.forEach((smallTag) => {
		const verseNumber = smallTag.textContent!.trim();
		let textNode = smallTag.nextSibling;
		let verseText = '';

		while (textNode && textNode.nodeName !== 'BR') {
			if (textNode.nodeType === Node.TEXT_NODE) {
				verseText += textNode.textContent!.trim();
			}
			textNode = textNode.nextSibling;
		}

		verses.push({ verseNumber, verseText });
	});

	return verses;
}

function formatVerses(verses: Verse[]): string {
	return verses.map(v => {
		const verseNumber = v.verseNumber.split(':')[1];
		return `${verseNumber} ${v.verseText}`;
	}).join('\n');
}

async function callAPI(query: string): Promise<string[]> {
	try {
		const apiUrl = `http://ibibles.net/quote.php?kor-${query}`;
		const response = await requestPromise(apiUrl);
		const extractedVerses = extractVerses(response);
		return [formatVerses(extractedVerses)];
	} catch (error) {
		console.error('Error fetching data:', error);
		return [];
	}
}

// Verse Suggest Modal class
class VerseSuggestModal extends SuggestModal<string> {
	private selectedVerses: string | null = null;

	constructor(app: App) {
		super(app);
		this.setInstructions([
			{ command: "", purpose: "Select verses to insert, ex: 요한복음3:16-18" }
		]);
	}

	async getSuggestions(query: string): Promise<string[]> {
		const match = verseMatch(query);
		if (match) {
			const book = match[1];
			const chapter = match[2];
			const verses = match[3];
			const bookNameQuery = Object.values(bookNames).find(bookName => bookName.koreanNames.includes(book));
			const queryString = `${bookNameQuery?.key}/${chapter}:${verses}`;
			const suggestions = await callAPI(queryString);
			this.selectedVerses = `${bookNameQuery?.koreanNames[0]} ${chapter}:${verses}`;
			return suggestions;
		}
		return [];
	}

	renderSuggestion(suggestion: string, el: HTMLElement) {
		el.createEl('div', { text: suggestion });
	}

	onChooseSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent) {
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (!editor) {
			return;
		}
		const formattedSuggestion = this.formatVersesForCallout(suggestion, this.selectedVerses);
		const cursor = editor.getCursor();
		editor.replaceRange(formattedSuggestion, cursor);

		const newCursorPosition = {
			line: cursor.line + formattedSuggestion.split('\n').length - 1,
			ch: formattedSuggestion.split('\n').pop()?.length || 0
		};
		editor.setCursor(newCursorPosition);
	}

	formatVersesForCallout(suggestion: string, selectedVerses: string | null): string {
		return `> [!quote]+ ${selectedVerses ? selectedVerses : '구절'}\n> ${suggestion}`;
	}
}

// Editor Suggest class
class VerseEditorSuggester extends EditorSuggest<string> {
    private plugin: KoreanBibleSearchPlugin;
    private settings: KoreanBibleSearchPluginSettings;
	private selectedVerses: string | null = null;

    constructor(plugin: KoreanBibleSearchPlugin, settings: KoreanBibleSearchPluginSettings) {
        super(plugin.app);
        this.plugin = plugin;
        this.settings = settings;
    }

    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
        const currentContent = editor.getLine(cursor.line).substring(0, cursor.ch);
        if (currentContent.length < 2) {
            return null;
        }
        const prefixTrigger = currentContent.substring(0, 2);
        if (prefixTrigger !== '++') {
            return null;
        }
        const queryContent = currentContent.substring(2);
        const match = verseMatch(queryContent);
        if (match) {
            return {
                end: cursor,
                start: { line: cursor.line, ch: 0 },
                query: match[0]
            };
        }
        return null;
    }

    async getSuggestions(context: EditorSuggestContext): Promise<string[]> {
        const match = verseMatch(context.query);
        if (match) {
            const book = match[1];
            const chapter = match[2];
            const verses = match[3];
            const bookNameQuery = Object.values(bookNames).find(bookName => bookName.koreanNames.includes(book));
            const queryString = `${bookNameQuery?.key}/${chapter}:${verses}`;
            const suggestions = await callAPI(queryString);
			this.selectedVerses = `${bookNameQuery?.koreanNames[0]} ${chapter}:${verses}`;
            return suggestions;
        }
        return [];
    }

    renderSuggestion(suggestion: string, el: HTMLElement) {
        el.createEl('div', { text: suggestion });
    }

    selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent) {
        const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (!editor) {
            return;
        }
        // Create a new instance of VerseSuggestModal to access the formatVersesForCallout method
        const verseSuggestModal = new VerseSuggestModal(this.plugin.app);
        const formattedSuggestion = verseSuggestModal.formatVersesForCallout(suggestion, this.selectedVerses);

        const { start, end } = this.context!;
        editor.replaceRange(formattedSuggestion, start, end);

        const newCursorPosition = {
            line: start.line + formattedSuggestion.split('\n').length - 1,
            ch: formattedSuggestion.split('\n').pop()?.length || 0
        };
        editor.setCursor(newCursorPosition);
    }
}

// Settings Tab class
class SampleSettingTab extends PluginSettingTab {
    plugin: KoreanBibleSearchPlugin;

    constructor(app: App, plugin: KoreanBibleSearchPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
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
