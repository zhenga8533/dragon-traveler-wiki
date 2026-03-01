import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Group,
  Image,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiFilmLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
} from 'react-icons/ri';
import type { CharacterIllustration } from '../../assets/character';
import { getCardHoverProps } from '../../constants/styles';
import { TRANSITION } from '../../constants/ui';

type TooltipInteractionProps = {
  openDelay: number;
  closeDelay: number;
  withArrow: boolean;
  position: 'top';
  events?: {
    hover: boolean;
    focus: boolean;
    touch: boolean;
  };
};

interface IllustrationPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  characterName: string;
  illustrations: CharacterIllustration[];
  activeIllustration: CharacterIllustration | null;
  activeIllustrationIndex: number;
  hasMultipleIllustrations: boolean;
  showPreviousIllustration: () => void;
  showNextIllustration: () => void;
  onSelectIllustration: (illustration: CharacterIllustration) => void;
  tooltipProps: TooltipInteractionProps;
}

export default function IllustrationPreviewModal({
  opened,
  onClose,
  characterName,
  illustrations,
  activeIllustration,
  activeIllustrationIndex,
  hasMultipleIllustrations,
  showPreviousIllustration,
  showNextIllustration,
  onSelectIllustration,
  tooltipProps,
}: IllustrationPreviewModalProps) {
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalHoverSide, setModalHoverSide] = useState<'left' | 'right' | null>(
    null
  );
  const thumbnailHintId = 'character-illustration-thumbnails-hint';
  const activeIllustrationName = activeIllustration?.name;

  const selectIllustrationByIndex = useCallback(
    (index: number) => {
      const candidate = illustrations[index];
      if (candidate) {
        onSelectIllustration(candidate);
      }
    },
    [illustrations, onSelectIllustration]
  );

  const handleThumbnailKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (illustrations.length === 0) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        selectIllustrationByIndex((index + 1) % illustrations.length);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        selectIllustrationByIndex(
          (index - 1 + illustrations.length) % illustrations.length
        );
      } else if (event.key === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        selectIllustrationByIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        event.stopPropagation();
        selectIllustrationByIndex(illustrations.length - 1);
      }
    },
    [illustrations.length, selectIllustrationByIndex]
  );

  const handleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    const el = mediaContainerRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      if (activeIllustration?.type === 'image' && activeIllustration.src) {
        window.open(activeIllustration.src, '_blank', 'noopener,noreferrer');
      }
    }
  }, [activeIllustration]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!opened || !hasMultipleIllustrations) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPreviousIllustration();
      else if (e.key === 'ArrowRight') showNextIllustration();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    opened,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  ]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      centered
      withCloseButton={false}
    >
      {activeIllustration && (
        <Stack gap="md">
          <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
            {`Illustration ${activeIllustrationIndex + 1} of ${illustrations.length}: ${activeIllustrationName ?? characterName}`}
          </VisuallyHidden>

          <Group justify="space-between" align="center">
            <Group gap="sm" align="center">
              <Text fw={600} size="lg">
                {activeIllustrationName ?? characterName}
              </Text>
              {activeIllustrationIndex >= 0 && (
                <Badge variant="light" color="gray">
                  {activeIllustrationIndex + 1}/{illustrations.length}
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              {activeIllustration.type === 'image' && (
                <Tooltip
                  label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  {...tooltipProps}
                >
                  <ActionIcon
                    onClick={handleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    variant="default"
                    radius="xl"
                  >
                    {isFullscreen ? (
                      <RiFullscreenExitLine />
                    ) : (
                      <RiFullscreenLine />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon
                onClick={onClose}
                aria-label="Close"
                variant="default"
                radius="xl"
              >
                <RiCloseLine />
              </ActionIcon>
            </Group>
          </Group>

          <Paper
            ref={mediaContainerRef}
            withBorder
            radius="lg"
            p={0}
            {...getCardHoverProps({
              style: {
                position: 'relative',
                maxHeight: isFullscreen ? '100dvh' : '70vh',
                overflow: isFullscreen ? 'hidden' : 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: isFullscreen ? 'black' : undefined,
                borderRadius: isFullscreen ? 0 : 'var(--mantine-radius-lg)',
              },
            })}
          >
            {activeIllustration.type === 'video' ? (
              <Box
                component="video"
                src={activeIllustration.src}
                controls
                style={{
                  width: '100%',
                  maxHeight: isFullscreen ? '100dvh' : '70vh',
                  borderRadius: isFullscreen ? 0 : 'var(--mantine-radius-lg)',
                }}
              />
            ) : (
              <Image
                src={activeIllustration.src}
                alt={`${characterName} - ${activeIllustration.name}`}
                fit="contain"
                mah={isFullscreen ? '100dvh' : '70vh'}
                radius={isFullscreen ? 0 : 'lg'}
                loading="lazy"
              />
            )}

            {hasMultipleIllustrations && (
              <>
                <Box
                  onMouseEnter={() => setModalHoverSide('left')}
                  onMouseLeave={() => setModalHoverSide(null)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: 84,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActionIcon
                    onClick={showPreviousIllustration}
                    aria-label="Previous illustration"
                    variant="filled"
                    color="dark"
                    radius="xl"
                    size="lg"
                    style={{
                      opacity: modalHoverSide === 'left' ? 1 : 0.55,
                      transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                      transform:
                        modalHoverSide === 'left' ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <RiArrowLeftSLine size={24} />
                  </ActionIcon>
                </Box>
                <Box
                  onMouseEnter={() => setModalHoverSide('right')}
                  onMouseLeave={() => setModalHoverSide(null)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: 84,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActionIcon
                    onClick={showNextIllustration}
                    aria-label="Next illustration"
                    variant="filled"
                    color="dark"
                    radius="xl"
                    size="lg"
                    style={{
                      opacity: modalHoverSide === 'right' ? 1 : 0.55,
                      transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                      transform:
                        modalHoverSide === 'right' ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <RiArrowRightSLine size={24} />
                  </ActionIcon>
                </Box>
              </>
            )}
          </Paper>

          {hasMultipleIllustrations && (
            <>
              <VisuallyHidden id={thumbnailHintId}>
                Use Left and Right Arrow keys to move between thumbnails. Use
                Home for first and End for last illustration.
              </VisuallyHidden>
              <Box
                role="listbox"
                aria-label="Illustration thumbnails"
                aria-describedby={thumbnailHintId}
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  overflowX: 'auto',
                  paddingBottom: 4,
                  paddingTop: 4,
                }}
              >
                {illustrations.map((illust, index) => {
                  const isActive = illust.name === activeIllustrationName;
                  return (
                    <Stack
                      key={`thumb-${illust.name}`}
                      gap={4}
                      align="center"
                      style={{ flexShrink: 0 }}
                    >
                      <UnstyledButton
                        onClick={() => onSelectIllustration(illust)}
                        onKeyDown={(event) =>
                          handleThumbnailKeyDown(event, index)
                        }
                        role="option"
                        aria-selected={isActive}
                        aria-current={isActive ? 'true' : undefined}
                        aria-keyshortcuts="ArrowLeft ArrowRight Home End"
                        aria-describedby={thumbnailHintId}
                        aria-label={`Go to ${illust.name}`}
                        style={{
                          width: 96,
                          height: 60,
                          borderRadius: 'var(--mantine-radius-sm)',
                          overflow: 'hidden',
                          border: `2px solid ${
                            isActive
                              ? 'var(--mantine-color-blue-5)'
                              : 'var(--mantine-color-default-border)'
                          }`,
                          opacity: isActive ? 1 : 0.6,
                          transition: `opacity ${TRANSITION.FAST}, border-color ${TRANSITION.FAST}`,
                        }}
                      >
                        {illust.type === 'video' ? (
                          <Center
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'var(--mantine-color-dark-6)',
                            }}
                          >
                            <RiFilmLine size={22} color="white" />
                          </Center>
                        ) : (
                          <Image
                            src={illust.src}
                            alt={illust.name}
                            w={96}
                            h={60}
                            fit="cover"
                            loading="lazy"
                          />
                        )}
                      </UnstyledButton>
                      <Text
                        size="xs"
                        c={isActive ? 'blue' : 'dimmed'}
                        fw={isActive ? 600 : 400}
                        ta="center"
                        lineClamp={1}
                        style={{ maxWidth: 96 }}
                      >
                        {illust.name}
                      </Text>
                    </Stack>
                  );
                })}
              </Box>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}
