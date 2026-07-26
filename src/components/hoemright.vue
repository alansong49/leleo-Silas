<template>
      <div>
        <div>
          <div :style="xs||sm?{'display':'none'}:{'font-size':'4rem'}" class="leleo-left-welcome" @dblclick="$emit('open-admin-password-dialog')">{{ configdata.welcometitle }}</div>
        </div>
        <div>
          <v-row align="center">
            <v-col cols="12" md="8">
				<v-text-field class="v-card"
					:style="xs||sm?{'display':'none'}:{}"
					v-model="searchQuery"
					placeholder="搜索..."
					variant="outlined"
					rounded
					hide-details="true"
					@keyup.enter="performSearch"
					>
					<template v-slot:prepend-inner>
						<v-menu>
							<template v-slot:activator="{ props }">
							<v-btn
								variant="text"
								v-bind="props"
								class="engine-btn"
							>
								{{ selectedEngine.title }}
								<v-icon icon="mdi-chevron-down"></v-icon>
							</v-btn>
							</template>
							<v-list class="glass-list">
								<v-list-item
									v-for="engine in searchEngines"
									:key="engine.value"
									@click="selectedEngine = engine"
									density="compact"
								>
									{{ engine.title }}
								</v-list-item>
							</v-list>
						</v-menu>
					</template>

					<template v-slot:append-inner>
						<v-btn
						:icon="isUrl ? 'mdi-earth' : 'mdi-magnify'"
						variant="text"
						@click="performSearch"
						></v-btn>
					</template>
					</v-text-field>
            	<typewriter class="ma-3 d-flex align-center justify-center" style="min-height: 200px; cursor: pointer;" @dblclick="handleTypewriterDoubleClick"></typewriter>
            </v-col>
            <v-col cols="12" md="4" align="center">
              <v-card class="ma-3" hover @dblclick="handleAddProjectClick"
                >
                  <template v-slot:title >
                    <span class="leleo-card-title clock-font">{{formattedTime}}</span>
                  </template>
                  <template v-slot:subtitle>
                    <span style="font-weight: bold;">{{formattedDate}}</span>
                  </template>
                  <turntable :color1="configdata.color.turntablecolor1" :color2="configdata.color.turntablecolor2" />
              </v-card>
            </v-col>
          </v-row>
          
          <v-chip class="mt-3 ml-3" prepend-icon="mdi-webhook"  size="large" style="color: var(--leleo-vcard-color);">
            部署项目
          </v-chip>
          <v-container>
            <v-row>
              <v-col
                v-for="(item,key) in projectcards"
                :key="key"
                cols="6"
                md="4"
                lg="3"
                :style="xs?{'padding': '6px'}:{}"
              >
                <v-card 
                  class="project-card"
                  :class="{'draggable': isAdminMode, 'dragging': draggedIndex === key, 'drag-over': dragOverIndex === key}"
                  @dblclick="$emit('open-edit-project-dialog', key)"
                  :draggable="isAdminMode"
                  @dragstart="handleDragStart(key, $event)"
                  @dragend="handleDragEnd"
                  @dragover.prevent="handleDragOver(key, $event)"
                  @dragenter.prevent="handleDragEnter(key)"
                  @dragleave="handleDragLeave(key)"
                  @drop.prevent="handleDrop(key, $event)"
                >
                  <v-img
                    aspect-ratio="1.7778"
                    :src= item.img
                    cover
                    :style="{ opacity: 0.8 }"
                    @error="handleImageError"
                  >
                    <template v-slot:placeholder>
                      <v-row
                        class="fill-height ma-0"
                        align="center"
                        justify="center"
                      >
                        <v-progress-circular
                          indeterminate
                          color="grey-lighten-5"
                        ></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                  <v-card-title :style="xs?{'font-size': '0.9rem','padding': '0.15rem 0.5rem'}:{'font-size': '1.1rem','padding':'0.2rem 0.8rem'}">
                    {{item.title}}
                  </v-card-title>
                  <v-card-subtitle :style="xs?{'font-size': '0.6rem','padding': '0.1rem 0.5rem'}:{'font-size': '0.8rem','padding':'0.15rem 0.6rem'}">
                    {{ item.subtitle }}
                  </v-card-subtitle>

                  <v-card-actions :style="xs||sm||md?{'padding': '0','min-height': '0','height':'2.5rem'}:{'min-height': '0','height':'2.8rem'}">
                    <v-btn :href="item.url"
                    target="_blank"
                      :text= "item.go"
                    ></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      v-if="isAdminMode"
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      @click.stop="$emit('delete-project', key)"
                      class="delete-btn"
                    >
                      <v-icon size="small">mdi-delete</v-icon>
                    </v-btn>
                    <v-btn
                      :icon="item.show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      @click="item.show = !item.show;projectcardsShow(key);"
                    ></v-btn>
                  </v-card-actions>
                  <v-expand-transition>
                    <div v-show="item.show">
                      <v-divider></v-divider>
                      <v-card-text :style="xs?{'font-size': '0.7rem'}:{}">
                        {{item.text}}
                      </v-card-text>
                    </div>
                  </v-expand-transition>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
          
        </div>       
      </div>
</template> 

<script>
import typewriter from '../components/typewriter.vue';
import turntable from '../components/turntable.vue';
import { useDisplay } from 'vuetify'

export default {
    components: {
        typewriter,turntable
    },
    props: ['configdata','formattedTime','formattedDate','projectcards','isAdminMode'],
	data() {
		return {
			searchQuery: '',
			selectedEngine: { title: 'Bing', value: 'bing' },
      		searchEngines :[
				{ title: 'Bing', value: 'bing' },
				{ title: 'Google', value: 'google' },
				{ title: '百度', value: 'baidu' },
				{ title: 'Yandex', value: 'yandex' },
				{ title: 'DuckDuckGo', value: 'duckduckgo' },
			],
			draggedIndex: null,
			dragOverIndex: null
		}
	},
    setup() {
      const { xs,sm,md } = useDisplay();
      return {xs,sm,md};
    },
	computed: {	
		isUrl(){
			const str = this.searchQuery.trim();
  			return this.isLikelyUrl(str);
		}
	},
    methods:{
      projectcardsShow(key){
        for(let i = 0;i < this.projectcards.length;i++){
          if(i != key){
            this.projectcards[i].show = false;
          }
        }
      },
	  performSearch() {
		const query = this.searchQuery.trim();
		if (!query) return;

		if (this.isUrl) {
			let url = query;
			// 自动补全协议（如果缺少）
			if (!/^[a-z]+:\/\//i.test(url)) {
				url = 'http://' + url; // 默认用http
			}
			
			window.open(url, '_blank');
		} else {
			const engineUrls = {
				google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
				bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
				baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
				yandex: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
				duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
			};
			window.open(engineUrls[this.selectedEngine.value], '_blank');
		}
	  },
	  isLikelyUrl(input) {
		// 移除首尾空格
		const str = input.trim();
		
		// 情况1：明确包含协议头（http/https/ftp等）
		if (/^(https?|ftp):\/\//i.test(str)) return true;
		
		// 情况2：符合域名格式（支持国际化域名）
		const domainPattern = /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i;
		
		// 情况3：localhost或IP地址
		const localPattern = /^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i;
		
		
		return (
			domainPattern.test(str) || 
			localPattern.test(str)
		);
		},
      handleAddProjectClick() {
        if (this.isAdminMode) {
          this.$emit('open-add-project-dialog');
        } else {
          this.$emit('show-admin-mode-required');
        }
      },
      handleEditProjectClick(key) {
        if (this.isAdminMode) {
          this.$emit('open-edit-project-dialog', key);
        } else {
          this.$emit('show-admin-mode-required');
        }
      },
      handleTypewriterDoubleClick() {
        if (this.isAdminMode) {
          this.$emit('open-typewriter-edit-dialog');
        } else {
          this.$emit('show-admin-mode-required');
        }
      },
      handleImageError(event) {
        // 图片加载失败时的处理
        console.warn('图片加载失败:', event.target.src);
        if (event.target.tagName === 'IMG') {
          event.target.style.display = 'none';
        }
      },
      handleDragStart(index, event) {
        if (!this.isAdminMode) {
          event.preventDefault();
          return;
        }
        this.draggedIndex = index;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', index);
        // 设置拖拽时的视觉效果
        event.target.style.opacity = '0.5';
      },
      handleDragEnd(event) {
        this.draggedIndex = null;
        this.dragOverIndex = null;
        event.target.style.opacity = '1';
      },
      handleDragOver(index, event) {
        if (!this.isAdminMode || this.draggedIndex === null) {
          return;
        }
        if (this.draggedIndex !== index) {
          event.dataTransfer.dropEffect = 'move';
        }
      },
      handleDragEnter(index) {
        if (!this.isAdminMode || this.draggedIndex === null) {
          return;
        }
        if (this.draggedIndex !== index) {
          this.dragOverIndex = index;
        }
      },
      handleDragLeave(index) {
        if (this.dragOverIndex === index) {
          this.dragOverIndex = null;
        }
      },
      handleDrop(targetIndex, event) {
        if (!this.isAdminMode || this.draggedIndex === null) {
          return;
        }
        event.preventDefault();
        const sourceIndex = this.draggedIndex;
        if (sourceIndex !== targetIndex) {
          this.$emit('swap-project-cards', sourceIndex, targetIndex);
        }
        this.draggedIndex = null;
        this.dragOverIndex = null;
      }
    }
};
</script>

<style scoped>
@import url(/css/app.less);
@import url(/css/mobile.less);
.glass-list {
	background: transparent !important;
	backdrop-filter: blur(var(--leleo-blur));
	border-radius: 5%;
	color: var(--leleo-vcard-color);
	overflow: hidden;
}
.delete-btn {
	transition: all 0.2s ease;
	opacity: 0.7;
	
	&:hover {
		opacity: 1;
		transform: scale(1.1);
		color: #ff5252 !important;
	}
}

.project-card {
	transition: all 0.3s ease;
	user-select: none;
}

.project-card.draggable {
	cursor: move;
}

.project-card.draggable:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-card.dragging {
	opacity: 0.5;
	transform: scale(0.95);
}

.project-card.drag-over {
	transform: scale(1.05);
	border: 2px dashed var(--leleo-vcard-color);
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
</style>
