/**
 * Frantic Battles - Player & Hero Database
 */

export interface HeroSkill {
  name: string;
  icon: string;
  cooldown: number; // in seconds
  desc: string;
}

export interface HeroData {
  id: string;
  name: string;
  title: string;
  style: string;
  rarity: 'ОБЫЧНЫЙ' | 'РЕДКИЙ' | 'ЭПИЧЕСКИЙ' | 'ЛЕГЕНДАРНЫЙ';
  color: number;
  colorHex: string;
  hp: number;
  speed: number;
  texture: string;
  portrait: string;
  attackDesc: string;
  skills: HeroSkill[];
}

export const HEROES: Record<string, HeroData> = {
  char_zaza: {
    id: 'char_zaza',
    name: 'ZAZA (Заза)',
    title: 'Токсичный Мутант',
    style: 'Яд, контроль зоны и трансформация в танка.',
    rarity: 'ЭПИЧЕСКИЙ',
    color: 0xa855f7,
    colorHex: '#c084fc',
    hp: 1000,
    speed: 290,
    texture: 'char_zaza',
    portrait: 'portrait_zaza',
    attackDesc: 'Удар в ближнем бою (урон 90).',
    skills: [
      {
        name: 'Плевок ядом',
        icon: 'skill_zaza_1',
        cooldown: 3.0,
        desc: 'Выпускает токсичный сгусток яда вперед. Образует лужу, наносящую урон.'
      },
      {
        name: 'Пропеллер',
        icon: 'skill_zaza_2',
        cooldown: 4.5,
        desc: 'Быстро вращает деревянную дубинку, отражая летящие снаряды.'
      },
      {
        name: 'Мутация монстра',
        icon: 'skill_zaza_3',
        cooldown: 14.0,
        desc: 'Мутирует в гигантского монстра (2000 HP) с новыми мощными атаками ближнего боя (укусы и рев).'
      }
    ]
  },
  char_grim: {
    id: 'char_grim',
    name: 'ГРИМ (Grim)',
    title: 'Теневой Алхимик',
    style: 'Скрытность, ловушки и взрывной урон.',
    rarity: 'ОБЫЧНЫЙ',
    color: 0x94a3b8,
    colorHex: '#cbd5e1',
    hp: 900,
    speed: 310,
    texture: 'char_grim',
    portrait: 'portrait_grim',
    attackDesc: 'Бросок алхимической колбы (урон 80).',
    skills: [
      {
        name: 'Смоляная бомба',
        icon: 'skill_grim_1',
        cooldown: 2.8,
        desc: 'Бьет колбой смолы, создавая вязкую ловушку, сильно замедляющую врагов.'
      },
      {
        name: 'Теневой шаг',
        icon: 'skill_grim_2',
        cooldown: 4.0,
        desc: 'Резкий скрытный рывок вперед с кратковременной невидимостью.'
      },
      {
        name: 'Взрывной котел',
        icon: 'skill_grim_3',
        cooldown: 13.0,
        desc: 'Устанавливает котел, который мощно взрывается через 1.5 секунды.'
      }
    ]
  },
  char_bjorn: {
    id: 'char_bjorn',
    name: 'БЬОРН (Bjorn)',
    title: 'Северный Берсерк',
    style: 'Агрессивный ближний бой, отбрасывание и массовый урон.',
    rarity: 'ОБЫЧНЫЙ',
    color: 0x94a3b8,
    colorHex: '#cbd5e1',
    hp: 1250,
    speed: 270,
    texture: 'char_bjorn',
    portrait: 'portrait_bjorn',
    attackDesc: 'Размашистый удар топором (урон 120).',
    skills: [
      {
        name: 'Землетрясение',
        icon: 'skill_bjorn_1',
        cooldown: 3.2,
        desc: 'Бьет ногой о землю, вызывая цепь каменных шипов прямо перед собой.'
      },
      {
        name: 'Мощный таран',
        icon: 'skill_bjorn_2',
        cooldown: 4.5,
        desc: 'Делает сокрушительный рывок плечом, отбрасывая противников.'
      },
      {
        name: 'Вихрь топоров',
        icon: 'skill_bjorn_3',
        cooldown: 12.0,
        desc: 'Бешено вращается с тяжелым топором, нанося АОЕ урон вокруг себя.'
      }
    ]
  }
};
