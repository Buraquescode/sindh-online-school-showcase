// lib/presentation/screens/section_topics/section_topics_screen.dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../models/section_model.dart';
import '../../../models/topic_model.dart';
import '../../../providers/content_provider.dart';
import '../../../providers/locale_provider.dart';

// Web player — resolved at compile time per platform
import '../../widgets/youtube_player_web.dart'
    if (dart.library.io) '../../widgets/youtube_player_stub.dart';

class SectionTopicsScreen extends StatefulWidget {
  final String sectionId;
  final SectionModel? section;

  const SectionTopicsScreen({
    super.key,
    required this.sectionId,
    this.section,
  });

  @override
  State<SectionTopicsScreen> createState() => _SectionTopicsScreenState();
}

class _SectionTopicsScreenState extends State<SectionTopicsScreen> {
  YoutubePlayerController? _youtubeController;
  TopicModel? _playingTopic;
  List<TopicModel> _topics = [];
  bool _isLoading = true;
  bool _isPlayerReady = false;

  @override
  void initState() {
    super.initState();
    _loadTopics();
  }

  Future<void> _loadTopics() async {
    final contentProvider = context.read<ContentProvider>();
    contentProvider.loadSectionTopics(widget.sectionId).listen((topics) {
      if (mounted) {
        setState(() {
          _topics = topics;
          _isLoading = false;
          if (_playingTopic == null && topics.isNotEmpty) {
            _playVideo(topics.first);
          }
        });
      }
    });
  }

  void _playVideo(TopicModel topic) {
    if (topic.youtubeId.isEmpty) return;

    setState(() {
      _playingTopic = topic;
      _isPlayerReady = false;
    });

    // Native controller only needed on mobile
    if (!kIsWeb) {
      if (_youtubeController != null) {
        _youtubeController!.load(topic.youtubeId);
      } else {
        _youtubeController = YoutubePlayerController(
          initialVideoId: topic.youtubeId,
          flags: const YoutubePlayerFlags(
            autoPlay: true,
            mute: false,
            enableCaption: false,
          ),
        )..addListener(_playerListener);
      }
    }
    // On web: setState above triggers rebuild → YouTubeWebPlayer recreates iframe
  }

  void _playerListener() {
    if (_youtubeController!.value.isReady && !_isPlayerReady) {
      setState(() => _isPlayerReady = true);
    }
  }

  @override
  void dispose() {
    _youtubeController?.removeListener(_playerListener);
    _youtubeController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEnglish = context.watch<LocaleProvider>().isEnglish;
    final sectionName = widget.section != null
        ? (isEnglish ? widget.section!.nameEn : widget.section!.nameSd)
        : 'Topics';

    // ── WEB build ──────────────────────────────────────────────────
    if (kIsWeb) {
      return _buildWebScaffold(sectionName, isEnglish);
    }

    // ── MOBILE build ───────────────────────────────────────────────
    return YoutubePlayerBuilder(
      player: YoutubePlayer(
        controller: _youtubeController ??
            YoutubePlayerController(
              initialVideoId: '',
              flags: const YoutubePlayerFlags(autoPlay: false),
            ),
        showVideoProgressIndicator: true,
        progressIndicatorColor: AppColors.primary,
        onReady: () => setState(() => _isPlayerReady = true),
      ),
      builder: (context, player) {
        return Scaffold(
          backgroundColor: const Color(0xFF0F0F0F),
          appBar: _buildAppBar(sectionName, isEnglish),
          body: Column(
            children: [
              if (_playingTopic != null && _youtubeController != null)
                _buildVideoPlayer(player, isEnglish)
              else
                _buildEmptyPlayer(isEnglish),
              Expanded(
                child: _isLoading
                    ? _buildShimmerList()
                    : _topics.isEmpty
                        ? _buildEmptyState(isEnglish)
                        : _buildPlaylist(isEnglish),
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Web Scaffold ────────────────────────────────────────────────
  Widget _buildWebScaffold(String sectionName, bool isEnglish) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: _buildAppBar(sectionName, isEnglish),
      body: Column(
        children: [
          // ✅ Web iframe player or empty state
          if (_playingTopic != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // iframe
                YouTubeWebPlayer(videoId: _playingTopic!.youtubeId),

                // Now Playing Info
                Container(
                  color: const Color(0xFF1A1A1A),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEnglish
                            ? _playingTopic!.nameEn
                            : _playingTopic!.nameSd,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.play_circle_outline,
                              color: Colors.redAccent, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${isEnglish ? 'Now Playing' : 'هاڻي ٻڌجي ٿو'}'
                            '${_playingTopic!.durationMinutes > 0 ? '  •  ${_playingTopic!.durationMinutes} min' : ''}',
                            style: TextStyle(
                                color: Colors.grey[400], fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Playlist label
                Container(
                  color: const Color(0xFF0F0F0F),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    children: [
                      const Icon(Icons.playlist_play,
                          color: Colors.white70, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        isEnglish ? 'Playlist' : 'پلے لسٽ',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${_topics.length} ${isEnglish ? 'videos' : 'وڊيوز'}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            )
          else
            _buildEmptyPlayer(isEnglish),

          // Playlist
          Expanded(
            child: _isLoading
                ? _buildShimmerList()
                : _topics.isEmpty
                    ? _buildEmptyState(isEnglish)
                    : _buildPlaylist(isEnglish),
          ),
        ],
      ),
    );
  }

  // ── AppBar ──────────────────────────────────────────────────────
  AppBar _buildAppBar(String sectionName, bool isEnglish) {
    return AppBar(
      backgroundColor: const Color(0xFF1A1A1A),
      foregroundColor: Colors.white,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => context.pop(),
      ),
      title: Text(
        sectionName,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: [
        if (_topics.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${_topics.length} ${isEnglish ? 'videos' : 'وڊيوز'}',
                style: TextStyle(color: Colors.grey[400], fontSize: 13),
              ),
            ),
          ),
      ],
    );
  }

  // ── Mobile video player section ─────────────────────────────────
  Widget _buildVideoPlayer(Widget player, bool isEnglish) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        player,
        Container(
          color: const Color(0xFF1A1A1A),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEnglish ? _playingTopic!.nameEn : _playingTopic!.nameSd,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.play_circle_outline,
                      color: Colors.redAccent, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    '${isEnglish ? 'Now Playing' : 'هاڻي ٻڌجي ٿو'}'
                    '${_playingTopic!.durationMinutes > 0 ? '  •  ${_playingTopic!.durationMinutes} min' : ''}',
                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          color: const Color(0xFF0F0F0F),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              const Icon(Icons.playlist_play, color: Colors.white70, size: 20),
              const SizedBox(width: 8),
              Text(
                isEnglish ? 'Playlist' : 'پلے لسٽ',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Text(
                '${_topics.length} ${isEnglish ? 'videos' : 'وڊيوز'}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyPlayer(bool isEnglish) {
    return Container(
      height: 220,
      color: const Color(0xFF1A1A1A),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.play_circle_outline, size: 64, color: Colors.grey[700]),
            const SizedBox(height: 8),
            Text(
              isEnglish ? 'Select a video to play' : 'هڪ وڊيو چونڊيو',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaylist(bool isEnglish) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _topics.length,
      itemBuilder: (context, index) {
        final topic = _topics[index];
        final isPlaying = _playingTopic?.id == topic.id;
        return _buildTopicTile(topic, index, isPlaying, isEnglish);
      },
    );
  }

  Widget _buildTopicTile(
      TopicModel topic, int index, bool isPlaying, bool isEnglish) {
    return InkWell(
      onTap: () => _playVideo(topic),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        color: isPlaying
            ? AppColors.primary.withOpacity(0.15)
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            // ── Thumbnail ──────────────────────────────────────
            Stack(
              alignment: Alignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: topic.youtubeId.isNotEmpty
                      ? Image.network(
                          'https://img.youtube.com/vi/${topic.youtubeId}/mqdefault.jpg',
                          width: 120,
                          height: 68,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 120,
                            height: 68,
                            color: const Color(0xFF2A2A2A),
                            child: const Icon(Icons.broken_image,
                                color: Colors.grey),
                          ),
                        )
                      : Container(
                          width: 120,
                          height: 68,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2A2A2A),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.videocam_off,
                              color: Colors.grey),
                        ),
                ),
                if (isPlaying)
                  Container(
                    width: 120,
                    height: 68,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.45),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.pause_circle_filled,
                        color: Colors.white, size: 28),
                  )
                else
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.play_arrow,
                        color: Colors.white, size: 20),
                  ),
                if (topic.durationMinutes > 0)
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${topic.durationMinutes}:00',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(width: 12),

            // ── Info ────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 2, right: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isPlaying
                              ? AppColors.primary
                              : const Color(0xFF2A2A2A),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            color: isPlaying ? Colors.white : Colors.grey,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          isEnglish ? topic.nameEn : topic.nameSd,
                          style: TextStyle(
                            color: isPlaying ? Colors.white : Colors.grey[200],
                            fontSize: 13,
                            fontWeight:
                                isPlaying ? FontWeight.w600 : FontWeight.w400,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (isPlaying) ...[
                        const Icon(Icons.equalizer,
                            color: Colors.greenAccent, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          isEnglish ? 'Playing' : 'ٻڌجي ٿو',
                          style: const TextStyle(
                              color: Colors.greenAccent, fontSize: 11),
                        ),
                      ] else if (topic.durationMinutes > 0) ...[
                        Icon(Icons.timer_outlined,
                            color: Colors.grey[600], size: 13),
                        const SizedBox(width: 3),
                        Text(
                          '${topic.durationMinutes} min',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 11),
                        ),
                      ],
                      if (topic.viewCount > 0) ...[
                        if (topic.durationMinutes > 0 || isPlaying)
                          Text('  •  ',
                              style: TextStyle(color: Colors.grey[700])),
                        Icon(Icons.visibility_outlined,
                            color: Colors.grey[600], size: 13),
                        const SizedBox(width: 3),
                        Text(
                          '${topic.viewCount}',
                          style:
                              TextStyle(color: Colors.grey[600], fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Options menu
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: Colors.grey[600], size: 18),
              color: const Color(0xFF2A2A2A),
              onSelected: (value) {
                if (value == 'play') _playVideo(topic);
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  value: 'play',
                  child: Row(
                    children: [
                      const Icon(Icons.play_arrow,
                          color: Colors.white, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        isEnglish ? 'Play' : 'هلايو',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: const Color(0xFF2A2A2A),
          highlightColor: const Color(0xFF3A3A3A),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 120,
                  height: 68,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(height: 14, color: Colors.white),
                      const SizedBox(height: 8),
                      Container(height: 12, width: 100, color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(bool isEnglish) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_library_outlined, size: 64, color: Colors.grey[700]),
          const SizedBox(height: 16),
          Text(
            isEnglish ? 'No topics yet' : 'ڪي به موضوع نه آهن',
            style: TextStyle(color: Colors.grey[500], fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            isEnglish
                ? 'Topics will appear here once added'
                : 'موضوع شامل ٿيڻ کان پوءِ هتي نظر ايندا',
            style: TextStyle(color: Colors.grey[700], fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
