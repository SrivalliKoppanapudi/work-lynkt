import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../../lib/Superbase';
import { Heart, Bookmark, MessageCircle } from 'lucide-react-native';

const ViewPostModal = ({
  modalVisible,
  setModalVisible,
  selectedPost,
}) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [userAvatar, setUserAvatar] = useState('');
  const [loading, setLoading] = useState(true);


  const getSafeAvatar = (avatar_url, name) =>
    avatar_url?.trim()
      ? avatar_url
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

useEffect(() => {
  const fetchStatusAndComments = async () => {
    setLoading(true); // Start loading
    try {
      if (!selectedPost) return;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const postId = selectedPost.postId;

      const { data: likeData } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();
      setLiked(!!likeData);

      const { data: saveData } = await supabase
        .from("post_saves")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();
      setSaved(!!saveData);

      setLikeCount(selectedPost.stats.likes);
      setSaveCount(selectedPost.stats.saves);

      await fetchComments();

      const profileRes = await supabase
        .from('profiles')
        .select('profilePicture')
        .eq('id', userId)
        .single();
      setUserAvatar(profileRes.data?.profilePicture || '');
    } catch (error) {
      console.error("Error fetching post data:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  fetchStatusAndComments();
}, [selectedPost,modalVisible]);


  const fetchComments = async () => {
    const { data: rawComments, error } = await supabase
      .from('post_comments')
      .select('content, created_at, user_id')
      .eq('post_id', selectedPost.postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    const enrichedComments = await Promise.all(
      rawComments.map(async (cmt) => {
        const { data: post } = await supabase
          .from('posts')
          .select('user_name, user_avatar')
          .eq('user_id', cmt.user_id)
          .single();

        return {
          ...cmt,
          user: post || { user_name: 'Anonymous', user_avatar: '' },
        };
      })
    );

    setComments(enrichedComments);
  };

  const toggleLike = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    let newCount = liked ? likeCount - 1 : likeCount + 1;

    if(newCount < 0) {newCount = 0;}

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", selectedPost.postId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("post_likes")
        .insert([{ post_id: selectedPost.postId, user_id: userId }]);
    }

    await supabase
      .from("posts")
      .update({ likes: newCount })
      .eq("id", selectedPost.postId);

    setLiked(!liked);
    setLikeCount(newCount);
  };

  const toggleSave = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    let newCount = saved ? saveCount - 1 : saveCount + 1;
    if(newCount < 0) {newCount = 0;}

    if (saved) {
      await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", selectedPost.postId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("post_saves")
        .insert([{ post_id: selectedPost.postId, user_id: userId }]);
    }

    await supabase
      .from("posts")
      .update({ saves: newCount })
      .eq("id", selectedPost.postId);

    setSaved(!saved);
    setSaveCount(newCount);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId || !selectedPost) return;

    await supabase.from('post_comments').insert([
      {
        post_id: selectedPost.postId,
        user_id: userId,
        content: comment.trim(),
      },
    ]);

    await supabase
      .from('posts')
      .update({ comments: selectedPost.stats.comments + 1 })
      .eq('id', selectedPost.postId);

    setComment('');
    await fetchComments();
    Alert.alert('Comment added successfully!');
  };

  if (loading) {
  return (
    <Modal visible={modalVisible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </Modal>
  );
}

  return (
    
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (<Text style= { styles.loadingText}>Loading...</Text>) : selectedPost && <View style={styles.card}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: getSafeAvatar(selectedPost.user.avatar, selectedPost.user.name) }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.name}>{selectedPost.user.name}</Text>
                <Text style={styles.role}>{selectedPost.user.role}</Text>
                <Text style={styles.time}>{selectedPost.user.time}</Text>
              </View>
            </View>

            <Text style={styles.content}>{selectedPost.content}</Text>

            <View style={styles.imageGrid}>
              {selectedPost.images.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.image} />
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
                <Heart color={liked ? 'red' : 'black'} fill={liked ? 'red' : 'transparent'} />
                <Text style={styles.actionText}>{likeCount}</Text>
              </TouchableOpacity>
              <View style={styles.actionBtn}>
                <MessageCircle size={18} color="#444" />
                <Text style={styles.actionText}>{comments.length}</Text>
              </View>
              <TouchableOpacity onPress={toggleSave} style={styles.actionBtn}>
                <Bookmark color={saved ? '#007aff' : 'black'} fill={saved ? '#007aff' : 'transparent'} />
                <Text style={styles.actionText}>{saveCount}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

            <View style={styles.commentInputBox}>
              
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your thoughts here..."
                style={styles.commentInput}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.commentButton}>
                <Text style={{ color: 'white' }}>Post</Text>
              </TouchableOpacity>
            </View>

            {comments.map((cmt, index) => (
              <View key={index} style={styles.commentItem}>
                <Image
                  source={{ uri: getSafeAvatar(cmt.user.user_avatar, cmt.user.user_name) }}
                  style={styles.commentAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentName}>{cmt.user.user_name}</Text>
                  <Text>{cmt.content}</Text>
                </View>
               {/* <TouchableOpacity><Text>👍</Text></TouchableOpacity>
                <TouchableOpacity><Text>↩</Text></TouchableOpacity>*/}
              </View>
            ))}

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>}
        
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  role: { color: '#555', fontSize: 14 },
  time: { color: '#888', fontSize: 12 },
  content: { fontSize: 16, marginBottom: 16, color: '#333' },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  image: {
    width: '48%',
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  commentInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  commentButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  commentName: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: 'blue',
    fontSize: 16,
  },
  loadingText: {
  fontSize: 18,
  color: '#666',
  textAlign: 'center',
  marginTop: 40,
},

});

export default ViewPostModal;
