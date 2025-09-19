/**
 * iOS 스타일 애니메이션 정의
 * Framer Motion 기반의 iOS 스타일 애니메이션 설정
 */

import { Variants, Transition, TargetAndTransition } from 'framer-motion';

/**
 * Wiggle 애니메이션 설정
 * iOS 홈 화면의 앱 아이콘 흔들림 효과 재현
 */
export const wiggleAnimation: Variants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  wiggle: {
    rotate: [-2, 2, -2, 2, 0],
    scale: [1, 0.98, 1, 0.98, 1],
    transition: {
      rotate: {
        duration: 0.4,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
      scale: {
        duration: 0.4,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
  },
};

/**
 * 드래그 스프링 애니메이션 설정
 */
export const dragSpringTransition: Transition = {
  type: 'spring',
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

/**
 * 드래그 시작 시 애니메이션
 */
export const dragStartAnimation: TargetAndTransition = {
  scale: 1.1,
  opacity: 0.8,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

/**
 * 드래그 종료 시 애니메이션
 */
export const dragEndAnimation: TargetAndTransition = {
  scale: 1,
  opacity: 1,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  zIndex: 'auto',
  transition: dragSpringTransition,
};

/**
 * 재배치 트랜지션 효과
 */
export const layoutTransition: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 350,
  mass: 0.5,
};

/**
 * 편집 모드 진입 애니메이션
 */
export const enterEditModeAnimation: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  edit: {
    scale: 0.95,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * 편집 모드 종료 애니메이션
 */
export const exitEditModeAnimation: Variants = {
  edit: {
    scale: 0.95,
    opacity: 1,
  },
  normal: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      delay: 0.1,
    },
  },
};

/**
 * 삭제 버튼 애니메이션
 */
export const deleteButtonAnimation: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -90,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
      delay: 0.1,
    },
  },
  hover: {
    scale: 1.2,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.9,
  },
};

/**
 * 설정 버튼 애니메이션
 */
export const settingsButtonAnimation: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: 90,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
      delay: 0.15,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 30,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.9,
  },
};

/**
 * 위젯 추가 애니메이션
 */
export const addWidgetAnimation: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    y: 20,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
      delay: 0.1,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * 위젯 삭제 애니메이션
 */
export const removeWidgetAnimation: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

/**
 * 크기 조절 핸들 애니메이션
 */
export const resizeHandleAnimation: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.5,
    transition: {
      duration: 0.2,
    },
  },
  drag: {
    scale: 2,
    opacity: 0.8,
  },
};

/**
 * 페이드 인/아웃 애니메이션
 */
export const fadeAnimation: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 슬라이드 애니메이션
 */
export const slideAnimation: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 350,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

/**
 * 툴바 애니메이션
 */
export const toolbarAnimation: Variants = {
  hidden: {
    y: -100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * FAB (Floating Action Button) 애니메이션
 */
export const fabAnimation: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 15,
  },
  tap: {
    scale: 0.9,
    rotate: -15,
  },
};

/**
 * 그리드 컨테이너 애니메이션
 */
export const gridContainerAnimation: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/**
 * 그리드 아이템 애니메이션
 */
export const gridItemAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
};

/**
 * 햅틱 피드백 시뮬레이션 (시각적)
 */
export const hapticFeedback: TargetAndTransition = {
  scale: [1, 0.96, 1],
  transition: {
    duration: 0.1,
    ease: 'easeInOut',
  },
};

/**
 * 길게 누르기 애니메이션
 */
export const longPressAnimation: Variants = {
  normal: {
    scale: 1,
  },
  pressed: {
    scale: 0.96,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  activated: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * 페이지 전환 애니메이션
 */
export const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

/**
 * 모달 오버레이 애니메이션
 */
export const modalOverlayAnimation: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(10px)',
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 모달 콘텐츠 애니메이션
 */
export const modalContentAnimation: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 100,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 350,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 100,
    transition: {
      duration: 0.2,
    },
  },
};