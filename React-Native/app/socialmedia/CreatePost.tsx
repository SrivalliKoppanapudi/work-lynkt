
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from "../../lib/Superbase";
import { Picker } from '@react-native-picker/picker';

export default function CreatePost() {
  const router = useRouter();
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    hashtags: "",
    isPublic: true,
    selectedGroups: [],
    selectedCommunity: null,
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [existingPosts, setExistingPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    // Fetch groups
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('groups').select('id, name');
      if (!error && data) setGroups(data);
    };
    // Fetch communities
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from('communities').select('id, name');
      if (!error && data) setCommunities(data);
    };
    fetchGroups();
    fetchCommunities();
  }, []);

/*   // Fetch existing posts
  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles:user_id (id, name, profilePicture)`)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const processedPosts = data.map(post => ({
          ...post,
          mediaUrls: post.media_urls?.map(url =>
            supabase.storage.from('post-media').getPublicUrl(url).data.publicUrl
          ) || []
        }));
        setExistingPosts(processedPosts);
      }
      setPostsLoading(false);
    };
    fetchPosts();
  }, []); */

  // Image picker function
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const newMedia = {
        type: 'image',
        uri: asset.uri,
        name: asset.fileName || 'image-' + new Date().getTime()
      };
      setMediaFiles([...mediaFiles, newMedia]);
    }
  };

  // File picker function
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newMedia = {
          type: 'file',
          uri: asset.uri,
          name: asset.name
        };
        setMediaFiles([...mediaFiles, newMedia]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Function to handle post submission
  const handlePublishPost = async () => {
    if (!postData.title.trim() || !postData.content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Upload media files if any
      const mediaUrls = [];
      for (const media of mediaFiles) {
        const fileExt = media.uri.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Fetch the file as a blob (works for both images and files)
        const response = await fetch(media.uri);
        const fileBlob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, fileBlob, {
            contentType: media.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        mediaUrls.push(filePath);
      }

      // Create post in database
      /* const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postData.title,
          content: postData.content,
          hashtags: postData.hashtags.split(' ').filter(tag => tag.startsWith('#')),
          media_urls: mediaUrls,
          is_public: postData.isPublic,
          shared_groups: postData.selectedGroups,
          shared_community: postData.selectedCommunity,
        });

      if (postError) {
        console.error('Error creating post:', postError);
        Alert.alert("Error", "Failed to create post. Please try again.");
      }; */
      const payload = {
  user_id: user.id,
  user_name: user.user_metadata?.full_name || 'Unknown',
  user_role: user.user_metadata?.role || 'Member',
  user_avatar: user.user_metadata?.avatar_url || '',
  title: postData.title,
  content: postData.content,
  hashtags: postData.hashtags.split(' ').filter(tag => tag.startsWith('#')),
  media_urls: mediaUrls,
  visibility: postData.isPublic ? 'public' : 'private',
  shared_groups: postData.selectedGroups || [],
  shared_community: postData.selectedCommunity || null,
};

console.log('Payload being inserted:', payload);

const { error: postError } = await supabase.from('posts').insert(payload);
if (postError) {
  console.error('Post insert error:', postError.message);
  Alert.alert("Error", postError.message);
}


      Alert.alert("Success", "Post published successfully!");
      // Reset form
      setPostData({ title: "", content: "", hashtags: "", isPublic: true, selectedGroups: [], selectedCommunity: null });
      setMediaFiles([]);
      router.replace('/(screens)/SocialMediaDashboard'); // Navigate to dashboard
      // Optionally, refresh posts
         

      
    } catch (error) {
      console.error('Error publishing post:', error);
      Alert.alert("Error", "Failed to publish post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // TODO: Implement draft saving functionality
    Alert.alert("Info", "Draft saving will be implemented soon!");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(screens)/SocialMediaDashboard')} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Post</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Title Input */}
        <TextInput
          style={styles.titleInput}
          placeholder="Add description title"
          value={postData.title}
          onChangeText={(text) => setPostData({ ...postData, title: text })}
        />

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Share your teaching resources..."
          multiline
          value={postData.content}
          onChangeText={(text) => setPostData({ ...postData, content: text })}
        />

        {/* Hashtags Input */}
        <TextInput
          style={styles.hashtagInput}
          placeholder="Add hashtags"
          value={postData.hashtags}
          onChangeText={(text) => setPostData({ ...postData, hashtags: text })}
        />

        {/* Media Preview */}
        {mediaFiles.length > 0 && (
          <View style={styles.mediaPreview}>
            {mediaFiles.map((media, index) => (
              media.type === 'image' ? (
                <Image
                  key={index}
                  source={{ uri: media.uri }}
                  style={styles.mediaPreviewImage}
                />
              ) : (
                <View key={index} style={styles.filePreview}>
                  <Ionicons name="document" size={24} color={Colors.PRIMARY} />
                  <Text numberOfLines={1} style={styles.fileName}>{media.name}</Text>
                </View>
              )
            ))}
          </View>
        )}

        {/* Media Upload Buttons */}
        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color={Colors.PRIMARY} />
            <Text style={styles.uploadButtonText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="document" size={24} color={Colors.PRIMARY} />
            <Text style={styles.uploadButtonText}>Upload File</Text>
          </TouchableOpacity>
        </View>

        {/* Visibility Section */}
        <View style={styles.visibilitySection}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.visibilityToggle}>
            <Text>Public</Text>
            <Switch
              value={postData.isPublic}
              onValueChange={(value) => setPostData({ ...postData, isPublic: value })}
            />
          </View>
          <Text style={styles.visibilityText}>
            Visible to all lynkt members
          </Text>
        </View>

        {/* Share to Groups Dropdown */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Share to Groups</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>Post in specific teachers groups</Text>
          <Picker
            selectedValue={postData.selectedGroups[0] || ''}
            onValueChange={(itemValue) => setPostData({ ...postData, selectedGroups: itemValue ? [itemValue] : [] })}
            style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
          >
            <Picker.Item label="Select" value="" />
            {groups.map((group) => (
              <Picker.Item key={group.id} label={group.name} value={group.name} />
            ))}
          </Picker>
        </View>

        {/* Share to Community Dropdown */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Share to Community</Text>
          <Text style={{ color: '#666', marginBottom: 4 }}>Post in specific teachers community</Text>
          <Picker
            selectedValue={postData.selectedCommunity || ''}
            onValueChange={(itemValue) => setPostData({ ...postData, selectedCommunity: itemValue })}
            style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
          >
            <Picker.Item label="Select" value="" />
            {communities.map((community) => (
              <Picker.Item key={community.id} label={community.name} value={community.name} />
            ))}
          </Picker>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={handlePublishPost}
            disabled={loading}
          >
            <Text style={styles.publishButtonText}>
              {loading ? "Publishing..." : "Publish Post"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.draftButton]}
            onPress={handleSaveDraft}
            disabled={loading}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Posts Section */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Recent Posts</Text>
          {postsLoading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          ) : existingPosts.length === 0 ? (
            <Text style={{ color: '#666', textAlign: 'center' }}>No posts yet.</Text>
          ) : (
            existingPosts.map((post) => (
              <View key={post.id} style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16, padding: 12 }}>
                {/* Post Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Image
                    source={post.profiles?.profilePicture ? { uri: post.profiles.profilePicture } : require('../../assets/images/default.png')}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
                  />
                  <View>
                    <Text style={{ fontWeight: 'bold', color: Colors.PRIMARY }}>{post.profiles?.name || 'Anonymous'}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                {/* Post Content */}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{post.title}</Text>
                <Text style={{ marginBottom: 6 }}>{post.content}</Text>
                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                    {post.hashtags.map((tag, idx) => (
                      <Text key={idx} style={{ color: Colors.PRIMARY, marginRight: 8 }}>#{tag.replace('#','')}</Text>
                    ))}
                  </View>
                )}
                {/* Media Preview */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <ScrollView horizontal style={{ marginBottom: 6 }}>
                    {post.mediaUrls.map((url:any, idx:any) => (
                      <Image key={idx} source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8 }} />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.PRIMARY,
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  hashtagInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 16,
  },
  mediaPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  mediaPreviewImage: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    margin: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  fileName: {
    marginLeft: 8,
    maxWidth: 150,
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: Colors.PRIMARY,
  },
  visibilitySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  visibilityToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  visibilityText: {
    color: "#666",
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  publishButton: {
    backgroundColor: Colors.PRIMARY,
  },
  draftButton: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  publishButtonText: {
    color: Colors.WHITE,
    fontWeight: "bold",
  },
  draftButtonText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
}); 