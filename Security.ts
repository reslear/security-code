import { defineComponent, reactive, computed, watch, toRefs, createVNode} from 'vue';
import { SecurityCodeDom } from './SecurityCodeDom';
import * as _ from 'lodash';

interface SecurityCodeInterface {
	securityCode: string[],
	sizes: {
		small: string,
		default: string,
		lg: string,
		xl: string,
	}
}

export default defineComponent({
	name: 'ofcold-security-code',
	props: {
		modelValue: { type: String, default: null },
		blurOnComplete: { type: Boolean, default: false },
		len: { type: Number, default: 6 },
		isArray: { type: Boolean, default: true },
		size: { type: String, default: 'default' },
	},
	emits: ['update:modelValue'],
	setup({ modelValue, blurOnComplete, len, isArray, size }, context) {
		// const { modelValue, blurOnComplete, len, isArray, size } = toRefs<any>(props);
		const data = reactive<SecurityCodeInterface>({
			securityCode: new Array(len),
			sizes: {
				small: 'w-8 h-8',
				default: 'w-12 h-12 text-xl',
				lg: 'w-16 h-16 text-3xl',
				xl: 'w-20 h-20 text-4xl'
			}
		});

		// Monitor changes in modelValue and assign a data format that conforms to the input.
		watch(() => modelValue, (newValue): void => {
			data.securityCode = newValue.toString().substr(0, len).split('');
		}, {immediate: true });

		/**
		 * Choose different display sizes according to user needs.
		 *
		 * @param {[type]} () => _.get(data.sizes, 'size')
		 */
		const displaySize = computed(() => _.get(data.sizes, 'size'));

		/**
		 * Return the security code entered by the current user according to the return data requirements.
		 *
		 * @return string | string[]
		 */
		function returnCode (): string | string[] {
			let code = isArray ? _.filter(data.securityCode) : data.securityCode.join('');
			context.emit('update:modelValue', code);
			return code;
		}

		function pasteEvent (index: number, event: ClipboardEvent) {
			let dom = SecurityCodeDom.make(event);
			const win = window as any;

			let i: number,
				elements = dom.childrens(),
				len: number = 0,
				pasteData: string[] | string = '';

			for (event.clipboardData && event.clipboardData.getData
				 ? pasteData = event.clipboardData.getData('Text')
				 : win.clipboardData && win.clipboardData.getData && (pasteData = win.clipboardData.getData('Text'))
				 , pasteData = (pasteData as string).replace(/\s/g, '').substr(0, elements.length - index).split(''),
				 i = 0; i < elements.length && !isNaN(Number(pasteData[i])); i++) {
				len++;
				(elements[i + index].firstChild as HTMLInputElement).value = pasteData[i];
				data.securityCode[i + index] = pasteData[i];
			}

			return [
				setTimeout((): void => {
					returnCode().length === len
						 ? (
							 blurOnComplete
								 ? dom.target().blur()
								 : dom.firstChildByNode(returnCode().length - 1)
						 )
						 : dom.firstChildByNode(index)
				}, 0),
				dom.preventDefault(),
				false
			];
		}

		const createInputNode = (k: number) => {
			return createVNode('input', {
				type: 'text',
				maxlength: 1,
				autocorrect: 'off',
				autocomplete: 'off',
				autocapitalize: 'off',
				spellcheck: false,
				value: data.securityCode[k],
				onFocus: (e: FocusEvent) => SecurityCodeDom.make(e).target().select(),
				onInput: (e: InputEvent) => {
					data.securityCode[k] = (e.target as HTMLInputElement).value;
					SecurityCodeDom.make(e).inputEvent(returnCode().length === len, blurOnComplete);
				},
				onKeydown: (e: KeyboardEvent) => SecurityCodeDom.make(e).downEvent(),
				onKeypress: (e: KeyboardEvent) => SecurityCodeDom.make(e).pressEvent(),
				onPaste: (e: ClipboardEvent) => pasteEvent(k, e),
				class: 'focus:outline-none border text-center w-full h-full rounded',
			});
		};

		const createNodeItems = () => {
			let nodes: any = [], k: number = 0;

			for(k; k < len as any; k ++) {
				nodes.push(createVNode('div', {
					class: `inline-block mr-4 ${_.get(data.sizes, size)}`,
					'task-id': `ofcold-security-code-id-${k}`
				}, [
					createInputNode(k)
				]));
			}

			return nodes;
		};

		return () => createVNode('div', {class: 'flex'}, createNodeItems());
	}
});
